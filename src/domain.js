const { PRODUCT_STATUSES } = require("./config");
const { toPublicUrl } = require("./utils");

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateInput = (value) => {
  if (!value) {
    throw new Error("expiryDate is required");
  }

  const parsed = new Date(value);
  const timestamp = parsed.getTime();

  if (Number.isNaN(timestamp)) {
    throw new Error("expiryDate must be a valid YYYY-MM-DD date");
  }

  return timestamp;
};

const formatDate = (timestamp) => {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp).toISOString().slice(0, 10);
};

const getTodayStartMs = () => {
  const today = new Date();
  return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
};

const getDDay = (expiryDateMs) => Math.floor((expiryDateMs - getTodayStartMs()) / DAY_MS);

const calculateCurrentPrice = (originalPrice, dDay) => {
  if (dDay <= 0) {
    return Math.round(originalPrice * 0.3);
  }

  if (dDay <= 2) {
    return Math.round(originalPrice * 0.5);
  }

  if (dDay <= 4) {
    return Math.round(originalPrice * 0.8);
  }

  return Math.round(originalPrice * 0.95);
};

const deriveProductStatus = ({ stock, expiryDateMs, deletedAt }) => {
  if (deletedAt) {
    return PRODUCT_STATUSES[4];
  }

  const dDay = getDDay(expiryDateMs);

  if (dDay < 0) {
    return PRODUCT_STATUSES[3];
  }

  if (stock <= 0) {
    return PRODUCT_STATUSES[2];
  }

  if (dDay <= 3) {
    return PRODUCT_STATUSES[1];
  }

  return PRODUCT_STATUSES[0];
};

const buildProductState = (row) => {
  const dDay = getDDay(row.expiry_date);
  const currentPrice = calculateCurrentPrice(row.original_price, dDay);
  const status = deriveProductStatus({
    stock: row.stock,
    expiryDateMs: row.expiry_date,
    deletedAt: row.deleted_at,
  });
  const discountRate = row.original_price > 0 ? Math.round(((row.original_price - currentPrice) / row.original_price) * 100) : 0;

  return {
    currentPrice,
    dDay,
    discountRate,
    status,
  };
};

const decorateProductRow = (row, options = {}) => {
  const state = buildProductState(row);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    originalPrice: row.original_price,
    currentPrice: state.currentPrice,
    discountRate: state.discountRate,
    stock: row.stock,
    expiryDate: formatDate(row.expiry_date),
    dDay: state.dDay,
    imageUrl: toPublicUrl(row.image_url, options.publicOrigin),
    status: state.status,
    sellerShopName: row.shop_name || null,
  };
};

const getRemainSeconds = (expiryDateMs) => {
  const expiresAt = expiryDateMs + DAY_MS;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
};

module.exports = {
  DAY_MS,
  buildProductState,
  calculateCurrentPrice,
  decorateProductRow,
  formatDate,
  getDDay,
  getRemainSeconds,
  parseDateInput,
};
