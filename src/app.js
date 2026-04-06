const express = require("express");
const path = require("path");
const { swaggerUi, swaggerSpec } = require("./swagger");
const { router: authRouter } = require("./auth");
const { productsRouter, sellerProductsRouter } = require("./products");
const { router: cartRouter } = require("./cart");
const { router: ordersRouter } = require("./orders");
const { router: alertsRouter } = require("./alerts");
const { router: uploadsRouter } = require("./uploads");
const { errorHandler, notFoundHandler } = require("./errors");
const { UPLOAD_LOCAL_DIR } = require("./config");

const app = express();

app.use(express.json());

/**
 * @openapi
 * /health:
 *   get:
 *     summary: 상태 확인 (Health Check)
 *     description: API 서버의 현재 상태를 반환합니다.
 *     responses:
 *       200:
 *         description: 서버가 정상 작동 중입니다.
 */
app.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

// 로컬 드라이버 사용 시 업로드된 이미지 정적 서빙
app.use("/uploads", express.static(UPLOAD_LOCAL_DIR));

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/seller/products", sellerProductsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/uploads", uploadsRouter);

app.use("/api-docs", ...swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
