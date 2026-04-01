const express = require("express");
const { PRODUCT_CATEGORIES } = require("./config");
const { db, getSellerProfileByUserId } = require("./db");
const { AppError, asyncHandler } = require("./errors");
const { authenticate } = require("./auth");
const { buildProductState, decorateProductRow, parseDateInput } = require("./domain");
const { syncProductSnapshotById } = require("./productPricing");
const { createId, now, parseInteger, parsePagination, pickFields } = require("./utils");

const productsRouter = express.Router();
const sellerProductsRouter = express.Router();

const selectProductRows = db.prepare(`
  SELECT p.*, sp.shop_name
  FROM products p
  JOIN seller_profiles sp ON sp.id = p.seller_id
`);

const selectProductById = db.prepare(`
  SELECT p.*, sp.shop_name, sp.user_id AS seller_user_id
  FROM products p
  JOIN seller_profiles sp ON sp.id = p.seller_id
  WHERE p.id = ?
`);

const selectPriceHistory = db.prepare(
  `SELECT d_day, price, created_at FROM price_history WHERE product_id = ? ORDER BY created_at DESC`,
);

const ensureSellerProfile = (userId, nickname) => {
  let sellerProfile = getSellerProfileByUserId.get(userId);
  if (!sellerProfile) {
    // 판매자 프로필이 없으면 자동 생성 (당근마켓 방식 - 누구나 판매 가능)
    const profileId = createId();
    const shopName = `${nickname || "사용자"} Shop`;
    db.prepare(
      `INSERT INTO seller_profiles (id, user_id, shop_name, created_at) VALUES (?, ?, ?, ?)`
    ).run(profileId, userId, shopName, now());
    sellerProfile = getSellerProfileByUserId.get(userId);
  }
  return sellerProfile;
};

const applyListFilters = (rows, query) => {
  const filteredRows = rows
    .map((row) => ({ row, decorated: decorateProductRow(row) }))
    .filter(({ decorated }) => !["DELETED", "EXPIRED"].includes(decorated.status))
    .filter(({ decorated }) => !query.category || decorated.category === query.category)
    .filter(({ decorated }) => !query.status || decorated.status === query.status)
    .filter(({ decorated }) => {
      if (!query.q) return true;
      const q = query.q.toLowerCase();
      return (
        decorated.name.toLowerCase().includes(q) ||
        (decorated.sellerShopName && decorated.sellerShopName.toLowerCase().includes(q))
      );
    });

  const sort = query.sort || "expiry_asc";

  filteredRows.sort((left, right) => {
    if (sort === "discount_desc") {
      return right.decorated.discountRate - left.decorated.discountRate;
    }

    if (sort === "price_asc") {
      return left.decorated.currentPrice - right.decorated.currentPrice;
    }

    if (sort === "price_desc") {
      return right.decorated.currentPrice - left.decorated.currentPrice;
    }

    return left.decorated.dDay - right.decorated.dDay;
  });

  return filteredRows.map(({ decorated }) => decorated);
};

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const rows = selectProductRows.all();
    const products = applyListFilters(rows, req.query);

    res.json({
      success: true,
      data: {
        products: products.slice(offset, offset + limit),
        pagination: {
          page,
          limit,
          total: products.length,
          totalPages: Math.max(1, Math.ceil(products.length / limit)),
        },
      },
    });
  }),
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = selectProductById.get(req.params.id);

    if (!row) {
      throw new AppError("상품을 찾을 수 없습니다.", 404);
    }

    const decoratedProduct = decorateProductRow(row);

    if (decoratedProduct.status === "DELETED") {
      throw new AppError("상품을 찾을 수 없습니다.", 404);
    }

    const history = selectPriceHistory
      .all(row.id)
      .map((entry) => ({ dDay: entry.d_day, price: entry.price }));

    res.json({
      success: true,
      data: {
        product: {
          ...decoratedProduct,
          seller: {
            id: row.seller_id,
            shopName: row.shop_name,
          },
          priceHistory: history,
        },
      },
    });
  }),
);

sellerProductsRouter.use(authenticate);

sellerProductsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const sellerProfile = ensureSellerProfile(req.user.id, req.user.nickname);
    const { name, description, category, originalPrice, stock, expiryDate, imageUrl } = req.body || {};

    if (!name || !category || originalPrice === undefined || stock === undefined || !expiryDate) {
      throw new AppError("name, category, originalPrice, stock, expiryDate are required", 400);
    }

    if (!PRODUCT_CATEGORIES.includes(category)) {
      throw new AppError("Invalid category", 400, { allowed: PRODUCT_CATEGORIES });
    }

    const originalPriceValue = parseInteger(originalPrice, "originalPrice", { min: 0 });
    const stockValue = parseInteger(stock, "stock", { min: 0 });
    const expiryDateValue = parseDateInput(expiryDate);
    const productId = createId();
    const currentTime = now();

    db.prepare(
      `
        INSERT INTO products (
          id, seller_id, name, description, category, original_price,
          current_price, stock, expiry_date, image_url, status,
          created_at, updated_at, deleted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `,
    ).run(
      productId,
      sellerProfile.id,
      String(name).trim(),
      description ? String(description).trim() : null,
      category,
      originalPriceValue,
      originalPriceValue,
      stockValue,
      expiryDateValue,
      imageUrl ? String(imageUrl).trim() : null,
      "ON_SALE",
      currentTime,
      currentTime,
    );

    const createdRow = selectProductById.get(productId);
    const state = syncProductSnapshotById(productId, { recordPriceHistory: true });

    res.status(201).json({
      success: true,
      data: {
        product: {
          id: productId,
          name: createdRow.name,
          category: createdRow.category,
          originalPrice: createdRow.original_price,
          currentPrice: state.currentPrice,
          stock: createdRow.stock,
          expiryDate,
          status: state.status,
        },
      },
    });
  }),
);

sellerProductsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const sellerProfile = ensureSellerProfile(req.user.id, req.user.nickname);
    const row = selectProductById.get(req.params.id);

    if (!row || row.seller_id !== sellerProfile.id || row.deleted_at) {
      throw new AppError("상품을 찾을 수 없습니다.", 404);
    }

    const updates = pickFields(req.body || {}, [
      "name",
      "description",
      "category",
      "originalPrice",
      "stock",
      "expiryDate",
      "imageUrl",
    ]);

    if (updates.category && !PRODUCT_CATEGORIES.includes(updates.category)) {
      throw new AppError("Invalid category", 400, { allowed: PRODUCT_CATEGORIES });
    }

    const nextRow = {
      ...row,
      name: updates.name !== undefined ? String(updates.name).trim() : row.name,
      description: updates.description !== undefined ? String(updates.description).trim() : row.description,
      category: updates.category !== undefined ? updates.category : row.category,
      original_price:
        updates.originalPrice !== undefined
          ? parseInteger(updates.originalPrice, "originalPrice", { min: 0 })
          : row.original_price,
      stock: updates.stock !== undefined ? parseInteger(updates.stock, "stock", { min: 0 }) : row.stock,
      expiry_date: updates.expiryDate !== undefined ? parseDateInput(updates.expiryDate) : row.expiry_date,
      image_url: updates.imageUrl !== undefined ? String(updates.imageUrl).trim() : row.image_url,
    };

    db.prepare(
      `
        UPDATE products
        SET name = ?, description = ?, category = ?, original_price = ?, stock = ?, expiry_date = ?, image_url = ?, updated_at = ?
        WHERE id = ?
      `,
    ).run(
      nextRow.name,
      nextRow.description,
      nextRow.category,
      nextRow.original_price,
      nextRow.stock,
      nextRow.expiry_date,
      nextRow.image_url,
      now(),
      row.id,
    );

    syncProductSnapshotById(row.id, { recordPriceHistory: true });
    const updatedRow = selectProductById.get(row.id);
    const decoratedProduct = decorateProductRow(updatedRow);

    res.json({
      success: true,
      data: {
        product: {
          id: decoratedProduct.id,
          name: decoratedProduct.name,
          currentPrice: decoratedProduct.currentPrice,
          stock: decoratedProduct.stock,
          expiryDate: decoratedProduct.expiryDate,
          status: decoratedProduct.status,
          updatedAt: updatedRow.updated_at,
        },
      },
    });
  }),
);

sellerProductsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const sellerProfile = ensureSellerProfile(req.user.id, req.user.nickname);
    const row = selectProductById.get(req.params.id);

    if (!row || row.seller_id !== sellerProfile.id || row.deleted_at) {
      throw new AppError("상품을 찾을 수 없습니다.", 404);
    }

    db.prepare(`UPDATE products SET status = 'DELETED', deleted_at = ?, updated_at = ? WHERE id = ?`).run(now(), now(), row.id);

    res.json({
      success: true,
      data: { message: "상품이 삭제되었습니다." },
    });
  }),
);

sellerProductsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const sellerProfile = ensureSellerProfile(req.user.id, req.user.nickname);
    const { page, limit, offset } = parsePagination(req.query);
    const rows = selectProductRows.all().filter((row) => row.seller_id === sellerProfile.id);
    const decorated = rows.map((row) => decorateProductRow(row));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();

    const todaySalesRow = db
      .prepare(
        `
          SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS today_sales
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE oi.seller_id = ? AND o.created_at >= ? AND o.status != 'CANCELLED'
        `,
      )
      .get(sellerProfile.id, todayStartMs);

    const todayOrdersRow = db
      .prepare(
        `
          SELECT COUNT(DISTINCT o.id) AS today_orders
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE oi.seller_id = ? AND o.created_at >= ? AND o.status != 'CANCELLED'
        `,
      )
      .get(sellerProfile.id, todayStartMs);

    const soldCountMap = new Map(
      db
        .prepare(
          `
            SELECT product_id, COALESCE(SUM(quantity), 0) AS today_sold_count
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.seller_id = ? AND o.created_at >= ? AND o.status != 'CANCELLED'
            GROUP BY product_id
          `,
        )
        .all(sellerProfile.id, todayStartMs)
        .map((entry) => [entry.product_id, entry.today_sold_count]),
    );

    res.json({
      success: true,
      data: {
        todaySales: todaySalesRow.today_sales,
        stats: {
          onSale: decorated.filter((product) => product.status === "ON_SALE").length,
          expirySoon: decorated.filter((product) => product.status === "EXPIRY_SOON").length,
          todayOrders: todayOrdersRow.today_orders,
        },
        products: decorated.slice(offset, offset + limit).map((product) => ({
          id: product.id,
          name: product.name,
          currentPrice: product.currentPrice,
          stock: product.stock,
          expiryDate: product.expiryDate,
          status: product.status,
          todaySoldCount: soldCountMap.get(product.id) || 0,
        })),
        pagination: {
          page,
          limit,
          total: decorated.length,
          totalPages: Math.max(1, Math.ceil(decorated.length / limit)),
        },
      },
    });
  }),
);

module.exports = {
  productsRouter,
  sellerProductsRouter,
};
