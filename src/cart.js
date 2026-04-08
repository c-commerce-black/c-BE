const express = require("express");
const { SHIPPING_FEE } = require("./config");
const { db } = require("./db");
const { AppError, asyncHandler } = require("./errors");
const { authenticate } = require("./auth");
const { buildProductState, decorateProductRow } = require("./domain");
const { createId, getPublicOrigin, now, parseInteger } = require("./utils");

const router = express.Router();

const selectCartRows = db.prepare(`
  SELECT ci.*, p.name, p.description, p.category, p.original_price, p.current_price, p.stock, p.expiry_date, p.image_url, p.status, p.deleted_at, sp.shop_name
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  JOIN seller_profiles sp ON sp.id = p.seller_id
  WHERE ci.user_id = ?
  ORDER BY ci.created_at DESC
`);

const selectCartItemById = db.prepare(
  `SELECT * FROM cart_items WHERE id = ? AND user_id = ?`,
);

const selectProductById = db.prepare(`
  SELECT p.*, sp.shop_name
  FROM products p
  JOIN seller_profiles sp ON sp.id = p.seller_id
  WHERE p.id = ?
`);

const selectExistingCartItem = db.prepare(
  `SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`,
);

const buildCartResponse = (userId, publicOrigin) => {
  const rows = selectCartRows.all(userId);
  const items = rows.map((row) => {
    const product = decorateProductRow(row, { publicOrigin });
    return {
      cartItemId: row.id,
      quantity: row.quantity,
      product,
      priceAtAdded: row.price_at_added,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const currentAmount = items.reduce((sum, item) => sum + item.product.currentPrice * item.quantity, 0);
  const summary = {
    totalAmount,
    discountAmount: Math.max(0, totalAmount - currentAmount),
    shippingFee: items.length > 0 ? SHIPPING_FEE : 0,
    finalAmount: currentAmount + (items.length > 0 ? SHIPPING_FEE : 0),
  };

  return {
    items: items.map((item) => ({
      cartItemId: item.cartItemId,
      quantity: item.quantity,
      product: item.product,
    })),
    summary,
    priceChanged: items.some((item) => item.priceAtAdded !== item.product.currentPrice),
  };
};

router.use(authenticate);

/**
 * @openapi
 * /api/cart:
 *   get:
 *     summary: 장바구니 조회
 *     description: 로그인한 사용자의 장바구니 항목과 결제 요약 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 장바구니 정보 반환
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: buildCartResponse(req.user.id, getPublicOrigin(req)),
    });
  }),
);

/**
 * @openapi
 * /api/cart:
 *   post:
 *     summary: 장바구니 상품 추가
 *     description: 특정 상품을 장바구니에 추가합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: integer }
 *     responses:
 *       201:
 *         description: 장바구니 추가 성공
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const productId = req.body?.productId;
    const quantity = parseInteger(req.body?.quantity, "quantity", { min: 1, allowZero: false });
    const row = selectProductById.get(productId);

    if (!row) {
      throw new AppError("상품을 찾을 수 없습니다.", 404);
    }

    const state = buildProductState(row);
    if (["SOLD_OUT", "DELETED", "EXPIRED"].includes(state.status)) {
      throw new AppError("장바구니에 담을 수 없는 상품입니다.", 400);
    }

    if (row.stock < quantity) {
      throw new AppError("재고가 부족합니다.", 400);
    }

    const currentTime = now();
    const existingItem = selectExistingCartItem.get(req.user.id, productId);

    if (existingItem) {
      const nextQuantity = existingItem.quantity + quantity;
      if (row.stock < nextQuantity) {
        throw new AppError("재고가 부족합니다.", 400);
      }

      db.prepare(
        `UPDATE cart_items SET quantity = ?, price_at_added = ?, updated_at = ? WHERE id = ?`,
      ).run(nextQuantity, state.currentPrice, currentTime, existingItem.id);

      res.status(201).json({
        success: true,
        data: {
          cartItem: { id: existingItem.id, productId, quantity: nextQuantity },
        },
      });
      return;
    }

    const cartItemId = createId();
    db.prepare(
      `
        INSERT INTO cart_items (id, user_id, product_id, quantity, price_at_added, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(cartItemId, req.user.id, productId, quantity, state.currentPrice, currentTime, currentTime);

    res.status(201).json({
      success: true,
      data: {
        cartItem: { id: cartItemId, productId, quantity },
      },
    });
  }),
);

/**
 * @openapi
 * /api/cart/{cartItemId}:
 *   patch:
 *     summary: 장바구니 항목 수량 변경
 *     description: 장바구니에 담긴 상품의 수량을 변경합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: 수량 변경 성공
 */
router.patch(
  "/:cartItemId",
  asyncHandler(async (req, res) => {
    const cartItem = selectCartItemById.get(req.params.cartItemId, req.user.id);

    if (!cartItem) {
      throw new AppError("장바구니 항목을 찾을 수 없습니다.", 404);
    }

    const quantity = parseInteger(req.body?.quantity, "quantity", { min: 1, allowZero: false });
    const product = selectProductById.get(cartItem.product_id);

    if (!product || product.stock < quantity) {
      throw new AppError("재고가 부족합니다.", 400);
    }

    const state = buildProductState(product);
    db.prepare(`UPDATE cart_items SET quantity = ?, price_at_added = ?, updated_at = ? WHERE id = ?`).run(
      quantity,
      state.currentPrice,
      now(),
      cartItem.id,
    );

    res.json({
      success: true,
      data: {
        cartItem: { id: cartItem.id, quantity, updatedAt: now() },
      },
    });
  }),
);

/**
 * @openapi
 * /api/cart/{cartItemId}:
 *   delete:
 *     summary: 장바구니 항목 삭제
 *     description: 장바구니에서 특정 항목을 삭제합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 */
router.delete(
  "/:cartItemId",
  asyncHandler(async (req, res) => {
    const result = db.prepare(`DELETE FROM cart_items WHERE id = ? AND user_id = ?`).run(req.params.cartItemId, req.user.id);
    if (!result.changes) {
      throw new AppError("장바구니 항목을 찾을 수 없습니다.", 404);
    }

    res.json({
      success: true,
      data: { message: "장바구니에서 삭제되었습니다." },
    });
  }),
);

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     summary: 장바구니 전체 비우기
 *     description: 장바구니의 모든 항목을 삭제합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 비우기 성공
 */
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    db.prepare(`DELETE FROM cart_items WHERE user_id = ?`).run(req.user.id);
    res.json({
      success: true,
      data: { message: "장바구니가 비워졌습니다." },
    });
  }),
);

module.exports = {
  buildCartResponse,
  router,
};
