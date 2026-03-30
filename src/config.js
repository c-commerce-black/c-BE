const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "app.db");
const JWT_SECRET = process.env.JWT_SECRET || "school-project-secret";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "7d";
const SHIPPING_FEE = 2500;

const ROLES = {
  USER: "USER",
};

const PRODUCT_CATEGORIES = ["FOOD", "BEAUTY", "DRINK", "MEAL_KIT", "OTHER"];
const PRODUCT_STATUSES = ["ON_SALE", "EXPIRY_SOON", "SOLD_OUT", "EXPIRED", "DELETED"];
const ORDER_STATUSES = ["PENDING", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED"];

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  DB_PATH,
  JWT_SECRET,
  ORDER_STATUSES,
  PORT,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  ROLES,
  SHIPPING_FEE,
};
