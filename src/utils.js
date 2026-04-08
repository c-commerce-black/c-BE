const crypto = require("crypto");

const createId = () => crypto.randomUUID();
const now = () => Date.now();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeNickname = (nickname) => String(nickname || "").trim();

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    createdAt: user.created_at,
    sellerProfileId: user.seller_profile_id || null,
    shopName: user.shop_name || null,
  };
};

const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || "20", 10) || 20, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

const parseInteger = (value, fieldName, options = {}) => {
  const { min = Number.NEGATIVE_INFINITY, allowZero = true } = options;
  const parsedValue = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`${fieldName} must be a number`);
  }

  if (!allowZero && parsedValue === 0) {
    throw new Error(`${fieldName} must be greater than 0`);
  }

  if (parsedValue < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }

  return parsedValue;
};

const pickFields = (source, keys) =>
  keys.reduce((accumulator, key) => {
    if (source[key] !== undefined) {
      accumulator[key] = source[key];
    }
    return accumulator;
  }, {});

const getPublicOrigin = (req) => {
  const forwardedProto = req.get("x-forwarded-proto");
  const forwardedHost = req.get("x-forwarded-host");
  const protocol = (forwardedProto ? forwardedProto.split(",")[0] : req.protocol || "http").trim();
  const host = (forwardedHost ? forwardedHost.split(",")[0] : req.get("host")).trim();

  return `${protocol}://${host}`;
};

const toPublicUrl = (value, publicOrigin) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return null;
  }

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  if (!publicOrigin) {
    return normalizedValue;
  }

  const pathname = normalizedValue.startsWith("/") ? normalizedValue : `/${normalizedValue}`;
  return new URL(pathname, publicOrigin).toString();
};

module.exports = {
  createId,
  getPublicOrigin,
  normalizeEmail,
  normalizeNickname,
  now,
  parseInteger,
  parsePagination,
  pickFields,
  sanitizeUser,
  toPublicUrl,
};
