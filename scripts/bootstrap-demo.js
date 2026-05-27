const bcrypt = require("bcryptjs");

const { DEFAULT_PAYMENT_BALANCE } = require("../src/config");
const { db, getSellerProfileByUserId, getUserByEmail } = require("../src/db");
const { parseDateInput } = require("../src/domain");
const { ensurePaymentProfile } = require("../src/payment-profiles");
const { syncProductSnapshotById } = require("../src/productPricing");
const { createId, normalizeEmail, normalizeNickname, now } = require("../src/utils");

const readStringEnv = (name, fallback) => String(process.env[name] || fallback).trim();
const readIntegerEnv = (name, fallback) => {
  const parsed = Number.parseInt(String(process.env[name] || fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
  buyer: {
    email: normalizeEmail(readStringEnv("BUYER_EMAIL", "demo-buyer@example.com")),
    nickname: normalizeNickname(readStringEnv("BUYER_NICKNAME", "DemoBuyer")),
    password: readStringEnv("BUYER_PASSWORD", "password123"),
    shopName: readStringEnv("BUYER_SHOP_NAME", "DemoBuyer Shop"),
  },
  seller: {
    email: normalizeEmail(readStringEnv("SELLER_EMAIL", "demo-seller@example.com")),
    nickname: normalizeNickname(readStringEnv("SELLER_NICKNAME", "DemoSeller")),
    password: readStringEnv("SELLER_PASSWORD", "password123"),
    shopName: readStringEnv("SELLER_SHOP_NAME", "Demo Fresh Shop"),
  },
  product: {
    name: readStringEnv("DEMO_PRODUCT_NAME", "오늘 수확한 딸기 박스"),
    description: readStringEnv("DEMO_PRODUCT_DESCRIPTION", "당일 수확한 신선 딸기 1박스"),
    category: readStringEnv("DEMO_PRODUCT_CATEGORY", "FOOD"),
    originalPrice: readIntegerEnv("DEMO_PRODUCT_PRICE", 12000),
    stock: readIntegerEnv("DEMO_PRODUCT_STOCK", 12),
    expiryDate: readStringEnv("DEMO_PRODUCT_EXPIRY", "2030-01-01"),
  },
  buyerTopupBalance: readIntegerEnv("BUYER_TOPUP_BALANCE", DEFAULT_PAYMENT_BALANCE),
};

const selectUserById = db.prepare(`SELECT * FROM users WHERE id = ?`);
const selectProductBySellerAndName = db.prepare(`
  SELECT p.*
  FROM products p
  WHERE p.seller_id = ? AND p.name = ? AND p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT 1
`);
const updateUserStatement = db.prepare(`
  UPDATE users
  SET nickname = ?, password_hash = ?, updated_at = ?
  WHERE id = ?
`);
const insertUserStatement = db.prepare(`
  INSERT INTO users (id, email, nickname, password_hash, role, created_at, updated_at)
  VALUES (?, ?, ?, ?, 'USER', ?, ?)
`);
const updateSellerProfileStatement = db.prepare(`
  UPDATE seller_profiles
  SET shop_name = ?
  WHERE id = ?
`);
const insertSellerProfileStatement = db.prepare(`
  INSERT INTO seller_profiles (id, user_id, shop_name, created_at)
  VALUES (?, ?, ?, ?)
`);
const insertProductStatement = db.prepare(`
  INSERT INTO products (
    id, seller_id, name, description, category, original_price,
    current_price, stock, expiry_date, image_url, status,
    created_at, updated_at, deleted_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'ON_SALE', ?, ?, NULL)
`);
const updateProductStatement = db.prepare(`
  UPDATE products
  SET description = ?, category = ?, original_price = ?, current_price = ?, stock = ?, expiry_date = ?, updated_at = ?
  WHERE id = ?
`);
const updatePaymentBalanceStatement = db.prepare(`
  UPDATE payment_profiles
  SET balance = ?, updated_at = ?
  WHERE id = ?
`);

function ensureUser({ email, nickname, password, shopName }) {
  const existingUser = getUserByEmail.get(email);
  const currentTime = now();
  const passwordHash = bcrypt.hashSync(password, 10);

  if (existingUser) {
    updateUserStatement.run(nickname, passwordHash, currentTime, existingUser.id);
    const sellerProfile = getSellerProfileByUserId.get(existingUser.id);
    if (sellerProfile) {
      updateSellerProfileStatement.run(shopName, sellerProfile.id);
    } else {
      insertSellerProfileStatement.run(createId(), existingUser.id, shopName, currentTime);
    }
    return selectUserById.get(existingUser.id);
  }

  const userId = createId();
  insertUserStatement.run(userId, email, nickname, passwordHash, currentTime, currentTime);
  insertSellerProfileStatement.run(createId(), userId, shopName, currentTime);
  return selectUserById.get(userId);
}

function ensureDemoProduct(sellerProfileId) {
  const existingProduct = selectProductBySellerAndName.get(sellerProfileId, config.product.name);
  const expiryDateMs = parseDateInput(config.product.expiryDate);
  const currentTime = now();

  if (existingProduct) {
    updateProductStatement.run(
      config.product.description,
      config.product.category,
      config.product.originalPrice,
      config.product.originalPrice,
      config.product.stock,
      expiryDateMs,
      currentTime,
      existingProduct.id,
    );
    syncProductSnapshotById(existingProduct.id, { recordPriceHistory: true });
    return existingProduct.id;
  }

  const productId = createId();
  insertProductStatement.run(
    productId,
    sellerProfileId,
    config.product.name,
    config.product.description,
    config.product.category,
    config.product.originalPrice,
    config.product.originalPrice,
    config.product.stock,
    expiryDateMs,
    currentTime,
    currentTime,
  );
  syncProductSnapshotById(productId, { recordPriceHistory: true });
  return productId;
}

const bootstrap = db.transaction(() => {
  const buyer = ensureUser(config.buyer);
  const seller = ensureUser(config.seller);

  const buyerSellerProfile = getSellerProfileByUserId.get(buyer.id);
  const sellerProfile = getSellerProfileByUserId.get(seller.id);

  const buyerPaymentProfile = ensurePaymentProfile(buyer.id);
  const sellerPaymentProfile = ensurePaymentProfile(seller.id);

  if (buyerPaymentProfile.balance < config.buyerTopupBalance) {
    updatePaymentBalanceStatement.run(config.buyerTopupBalance, now(), buyerPaymentProfile.id);
  }

  const productId = ensureDemoProduct(sellerProfile.id);

  return {
    buyer: {
      email: buyer.email,
      password: config.buyer.password,
      nickname: buyer.nickname,
      shopName: buyerSellerProfile.shop_name,
      walletId: ensurePaymentProfile(buyer.id).wallet_id,
    },
    seller: {
      email: seller.email,
      password: config.seller.password,
      nickname: seller.nickname,
      shopName: sellerProfile.shop_name,
      walletId: ensurePaymentProfile(seller.id).wallet_id,
    },
    productId,
    productName: config.product.name,
  };
});

try {
  const result = bootstrap();
  console.log("Demo bootstrap complete.");
  console.log("");
  console.log("Buyer");
  console.log(`  email: ${result.buyer.email}`);
  console.log(`  password: ${result.buyer.password}`);
  console.log(`  nickname: ${result.buyer.nickname}`);
  console.log(`  shopName: ${result.buyer.shopName}`);
  console.log(`  walletId: ${result.buyer.walletId}`);
  console.log("");
  console.log("Seller");
  console.log(`  email: ${result.seller.email}`);
  console.log(`  password: ${result.seller.password}`);
  console.log(`  nickname: ${result.seller.nickname}`);
  console.log(`  shopName: ${result.seller.shopName}`);
  console.log(`  walletId: ${result.seller.walletId}`);
  console.log("");
  console.log("Product");
  console.log(`  id: ${result.productId}`);
  console.log(`  name: ${result.productName}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
