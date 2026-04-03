const express = require("express");
const { ORDER_STATUSES, SHIPPING_FEE } = require("./config");
const { db, getSellerProfileByUserId } = require("./db");
const { AppError, asyncHandler } = require("./errors");
const { authenticate } = require("./auth");
const { buildProductState, decorateProductRow } = require("./domain");
const { createId, now } = require("./utils");

const router = express.Router();

const selectUserOrder = db.prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`);
const selectOrderById = db.prepare(`SELECT * FROM orders WHERE id = ?`);
const selectOrderItems = db.prepare(`
  SELECT oi.*, p.original_price, p.current_price, p.stock, p.expiry_date, p.image_url, p.description, p.category, p.status, p.deleted_at, sp.shop_name
  FROM order_items oi
  LEFT JOIN products p ON p.id = oi.product_id
  LEFT JOIN seller_profiles sp ON sp.id = oi.seller_id
  WHERE oi.order_id = ?
  ORDER BY oi.id ASC
`);
const selectUserOrders = db.prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`);
const selectCartItemsByIds = (userId, cartItemIds) => {
  const placeholders = cartItemIds.map(() => "?").join(", ");
  const statement = db.prepare(`
    SELECT ci.*, p.name, p.original_price, p.current_price, p.stock, p.expiry_date, p.image_url, p.status, p.deleted_at, p.seller_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ? AND ci.id IN (${placeholders})
  `);
  return statement.all(userId, ...cartItemIds);
};

const formatOrderItems = (orderId) =>
  selectOrderItems.all(orderId).map((row) => {
    if (!row.product_id || row.deleted_at) {
      return {
        productId: row.product_id,
        name: row.name_snapshot,
        imageUrl: row.image_url_snapshot,
        quantity: row.quantity,
        price: row.price,
        dDay: null,
      };
    }

    const decoratedProduct = decorateProductRow({
      ...row,
      name: row.name_snapshot,
      original_price: row.original_price,
      image_url: row.image_url,
    });

    return {
      productId: row.product_id,
      name: row.name_snapshot,
      imageUrl: row.image_url_snapshot || row.image_url,
      quantity: row.quantity,
      price: row.price,
      dDay: decoratedProduct.dDay,
    };
  });

const createOrderTransaction = db.transaction(({ userId, cartItemIds, shippingAddress }) => {
  const rows = selectCartItemsByIds(userId, cartItemIds);

  if (rows.length !== cartItemIds.length) {
    throw new AppError("선택한 장바구니 항목을 모두 찾을 수 없습니다.", 400);
  }

  for (const row of rows) {
    const state = buildProductState(row);
    if (["DELETED", "EXPIRED", "SOLD_OUT"].includes(state.status)) {
      throw new AppError(`${row.name} 상품은 주문할 수 없습니다.`, 400);
    }
    if (row.stock < row.quantity) {
      throw new AppError(`${row.name} 재고가 부족합니다.`, 400);
    }
  }

  const totalAmount = rows.reduce((sum, row) => sum + row.original_price * row.quantity, 0);
  const currentSubtotal = rows.reduce((sum, row) => sum + buildProductState(row).currentPrice * row.quantity, 0);
  const discountAmount = Math.max(0, totalAmount - currentSubtotal);
  const shippingFee = rows.length > 0 ? SHIPPING_FEE : 0;
  const finalAmount = currentSubtotal + shippingFee;
  const currentTime = now();
  const orderId = createId();

  db.prepare(
    `
      INSERT INTO orders (
        id, user_id, status, total_amount, discount_amount, shipping_fee, final_amount,
        shipping_address, created_at, updated_at, cancelled_at
      ) VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, NULL)
    `,
  ).run(orderId, userId, totalAmount, discountAmount, shippingFee, finalAmount, shippingAddress, currentTime, currentTime);

  const insertOrderItem = db.prepare(
    `
      INSERT INTO order_items (
        id, order_id, product_id, seller_id, name_snapshot, image_url_snapshot, quantity, price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  );

  const deleteCartItem = db.prepare(`DELETE FROM cart_items WHERE id = ?`);
  const updateProduct = db.prepare(`UPDATE products SET stock = ?, current_price = ?, status = ?, updated_at = ? WHERE id = ?`);

  for (const row of rows) {
    const state = buildProductState(row);
    insertOrderItem.run(
      createId(),
      orderId,
      row.product_id,
      row.seller_id,
      row.name,
      row.image_url,
      row.quantity,
      state.currentPrice,
    );

    const nextStock = row.stock - row.quantity;
    const nextState = buildProductState({ ...row, stock: nextStock });
    updateProduct.run(nextStock, nextState.currentPrice, nextState.status, currentTime, row.product_id);
    deleteCartItem.run(row.id);
  }

  return orderId;
});

const cancelOrderTransaction = db.transaction(({ order, items }) => {
  const currentTime = now();
  db.prepare(`UPDATE orders SET status = 'CANCELLED', cancelled_at = ?, updated_at = ? WHERE id = ?`).run(currentTime, currentTime, order.id);

  const updateProduct = db.prepare(`UPDATE products SET stock = ?, current_price = ?, status = ?, updated_at = ? WHERE id = ?`);

  for (const item of items) {
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(item.product_id);
    if (!product) {
      continue;
    }

    const nextStock = product.stock + item.quantity;
    const nextState = buildProductState({ ...product, stock: nextStock, deleted_at: product.deleted_at });
    updateProduct.run(nextStock, nextState.currentPrice, nextState.status, currentTime, product.id);
  }
});

router.use(authenticate);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: 주문 생성 (결제)
 *     description: 장바구니 항목들을 바탕으로 새로운 주문을 생성합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cartItemIds: 
 *                 type: array
 *                 items: { type: string }
 *               shippingAddress: { type: string }
 *     responses:
 *       201:
 *         description: 주문 생성 성공
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const cartItemIds = Array.isArray(req.body?.cartItemIds) ? req.body.cartItemIds : [];
    const shippingAddress = String(req.body?.shippingAddress || "").trim();

    if (!cartItemIds.length || !shippingAddress) {
      throw new AppError("cartItemIds and shippingAddress are required", 400);
    }

    const orderId = createOrderTransaction({
      userId: req.user.id,
      cartItemIds,
      shippingAddress,
    });

    const order = selectUserOrder.get(orderId, req.user.id);
    const items = formatOrderItems(orderId);

    res.status(201).json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: order.status,
          totalAmount: order.total_amount,
          discountAmount: order.discount_amount,
          shippingFee: order.shipping_fee,
          finalAmount: order.final_amount,
          shippingAddress: order.shipping_address,
          createdAt: order.created_at,
          items,
        },
      },
    });
  }),
);

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: 내 주문 목록 조회
 *     description: 사용자의 이전 주문 내역을 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 주문 목록 반환
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = selectUserOrders.all(req.user.id).map((order) => ({
      id: order.id,
      status: order.status,
      finalAmount: order.final_amount,
      createdAt: order.created_at,
      items: formatOrderItems(order.id).map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: 1,
          limit: orders.length || 1,
          total: orders.length,
          totalPages: 1,
        },
      },
    });
  }),
);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: 주문 상세 조회
 *     description: 특정 주문의 상세 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 주문 상세 정보 반환
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = selectUserOrder.get(req.params.id, req.user.id);
    if (!order) {
      throw new AppError("주문을 찾을 수 없습니다.", 404);
    }

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: order.status,
          totalAmount: order.total_amount,
          discountAmount: order.discount_amount,
          shippingFee: order.shipping_fee,
          finalAmount: order.final_amount,
          shippingAddress: order.shipping_address,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          items: formatOrderItems(order.id),
        },
      },
    });
  }),
);

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: 주문 취소
 *     description: PENDING 상태의 주문을 취소합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 주문 취소 성공
 */
router.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const order = selectUserOrder.get(req.params.id, req.user.id);
    if (!order) {
      throw new AppError("주문을 찾을 수 없습니다.", 404);
    }

    if (order.status === "CANCELLED") {
      res.json({ success: true, data: { message: "주문이 취소되었습니다." } });
      return;
    }

    if (order.status !== "PENDING") {
      throw new AppError("PENDING 상태의 주문만 취소할 수 있습니다.", 400);
    }

    const items = selectOrderItems.all(order.id);
    cancelOrderTransaction({ order, items });

    res.json({
      success: true,
      data: { message: "주문이 취소되었습니다." },
    });
  }),
);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     summary: 주문 상태 변경
 *     description: 판매자가 자신의 상품이 포함된 주문의 상태를 변경합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status: { type: string, enum: [PREPARING, SHIPPING, DELIVERED] }
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 */
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const order = selectOrderById.get(req.params.id);
    if (!order) {
      throw new AppError("주문을 찾을 수 없습니다.", 404);
    }

    const nextStatus = String(req.body?.status || "").trim();
    if (!ORDER_STATUSES.includes(nextStatus) || ["PENDING", "CANCELLED"].includes(nextStatus)) {
      throw new AppError("status must be PREPARING, SHIPPING, or DELIVERED", 400);
    }

    const sellerProfile = getSellerProfileByUserId.get(req.user.id);
    if (!sellerProfile) {
      throw new AppError("판매자 등록이 필요합니다.", 403);
    }

    const itemRows = selectOrderItems.all(order.id);
    const sellerOwnsOrder = itemRows.some((item) => item.seller_id === sellerProfile.id);
    if (!sellerOwnsOrder) {
      throw new AppError("본인 상품 주문만 변경할 수 있습니다.", 403);
    }

    const transitions = {
      PENDING: ["PREPARING"],
      PREPARING: ["SHIPPING"],
      SHIPPING: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!transitions[order.status].includes(nextStatus)) {
      throw new AppError("허용되지 않는 상태 전이입니다.", 400);
    }

    db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(nextStatus, now(), order.id);
    res.json({
      success: true,
      data: {
        order: { id: order.id, status: nextStatus, updatedAt: now() },
      },
    });
  }),
);

module.exports = {
  router,
};
