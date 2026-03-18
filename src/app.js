const express = require("express");
const { router: authRouter } = require("./auth");
const { productsRouter, sellerProductsRouter } = require("./products");
const { router: cartRouter } = require("./cart");
const { router: ordersRouter } = require("./orders");
const { router: alertsRouter } = require("./alerts");
const { errorHandler, notFoundHandler } = require("./errors");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/seller/products", sellerProductsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/alerts", alertsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
