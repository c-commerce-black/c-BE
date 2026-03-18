const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { DB_PATH, ORDER_STATUSES, PRODUCT_CATEGORIES, PRODUCT_STATUSES, ROLES } = require("./config");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('${ROLES.BUYER}', '${ROLES.SELLER}', '${ROLES.ADMIN}')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  shop_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('${PRODUCT_CATEGORIES.join("', '")}')),
  original_price INTEGER NOT NULL CHECK (original_price >= 0),
  current_price INTEGER NOT NULL CHECK (current_price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  expiry_date INTEGER NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('${PRODUCT_STATUSES.join("', '")}')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  d_day INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_added INTEGER NOT NULL CHECK (price_at_added >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('${ORDER_STATUSES.join("', '")}')),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  discount_amount INTEGER NOT NULL CHECK (discount_amount >= 0),
  shipping_fee INTEGER NOT NULL CHECK (shipping_fee >= 0),
  final_amount INTEGER NOT NULL CHECK (final_amount >= 0),
  shipping_address TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  cancelled_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  image_url_snapshot TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price >= 0),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  is_on INTEGER NOT NULL CHECK (is_on IN (0, 1)) DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
`;

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.exec(schemaSql);

const getUserWithSeller = db.prepare(`
  SELECT
    u.id,
    u.email,
    u.nickname,
    u.password_hash,
    u.role,
    u.created_at,
    sp.id AS seller_profile_id,
    sp.shop_name
  FROM users u
  LEFT JOIN seller_profiles sp ON sp.user_id = u.id
  WHERE u.id = ?
`);

const getUserByEmail = db.prepare(`
  SELECT
    u.id,
    u.email,
    u.nickname,
    u.password_hash,
    u.role,
    u.created_at,
    sp.id AS seller_profile_id,
    sp.shop_name
  FROM users u
  LEFT JOIN seller_profiles sp ON sp.user_id = u.id
  WHERE lower(u.email) = lower(?)
`);

const getSellerProfileByUserId = db.prepare(
  `SELECT id, user_id, shop_name FROM seller_profiles WHERE user_id = ?`,
);

module.exports = {
  db,
  getSellerProfileByUserId,
  getUserByEmail,
  getUserWithSeller,
};
