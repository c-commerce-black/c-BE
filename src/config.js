const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "app.db");
const JWT_SECRET = process.env.JWT_SECRET || "school-project-secret";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "7d";
const SHIPPING_FEE = 2500;
const STABLECOIN_DRIVER = process.env.STABLECOIN_DRIVER || "mock";
const STABLECOIN_BASE_URL = process.env.STABLECOIN_BASE_URL || "http://127.0.0.1:8090";
const STABLECOIN_OPERATOR_ID = process.env.STABLECOIN_OPERATOR_ID || "operator-default";
const STABLECOIN_PRIVATE_KEY_PEM = process.env.STABLECOIN_PRIVATE_KEY_PEM || "";
const STABLECOIN_TIMEOUT_MS = Math.max(Number.parseInt(process.env.STABLECOIN_TIMEOUT_MS || "5000", 10) || 5000, 1000);
const DEFAULT_PAYMENT_TOKEN = process.env.DEFAULT_PAYMENT_TOKEN || "USDC-test";
const DEFAULT_PAYMENT_BALANCE = Math.max(Number.parseInt(process.env.DEFAULT_PAYMENT_BALANCE || "500000", 10) || 500000, 0);

// 업로드 설정: UPLOAD_DRIVER=local(기본값) | s3
const UPLOAD_DRIVER = process.env.UPLOAD_DRIVER || "local";
const UPLOAD_LOCAL_DIR = path.join(__dirname, "..", "data", "uploads");
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "ap-northeast-2";

const ROLES = {
  USER: "USER",
};

const PRODUCT_CATEGORIES = ["FOOD", "BEAUTY", "DRINK", "MEAL_KIT", "OTHER"];
const PRODUCT_STATUSES = ["ON_SALE", "EXPIRY_SOON", "SOLD_OUT", "EXPIRED", "DELETED"];
const ORDER_STATUSES = ["PENDING", "PREPARING", "SHIPPING", "DELIVERED", "CANCELLED"];
const ORDER_PAYMENT_STATUSES = ["UNPAID", "FAILED", "PARTIAL", "PAID"];
const PAYMENT_RECORD_STATUSES = ["PENDING", "FAILED", "COMPLETED"];

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  DEFAULT_PAYMENT_BALANCE,
  DEFAULT_PAYMENT_TOKEN,
  DB_PATH,
  JWT_SECRET,
  ORDER_STATUSES,
  ORDER_PAYMENT_STATUSES,
  PAYMENT_RECORD_STATUSES,
  PORT,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  ROLES,
  S3_BUCKET,
  S3_REGION,
  SHIPPING_FEE,
  STABLECOIN_BASE_URL,
  STABLECOIN_DRIVER,
  STABLECOIN_OPERATOR_ID,
  STABLECOIN_PRIVATE_KEY_PEM,
  STABLECOIN_TIMEOUT_MS,
  UPLOAD_DRIVER,
  UPLOAD_LOCAL_DIR,
};
