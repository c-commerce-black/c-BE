const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_EXPIRES_IN, JWT_SECRET, ROLES } = require("./config");
const { db, getUserByEmail, getUserWithSeller } = require("./db");
const { AppError, asyncHandler } = require("./errors");
const { createId, normalizeEmail, normalizeNickname, now, sanitizeUser } = require("./utils");

const router = express.Router();

const signAccessToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );

const getExpiresInSeconds = () => {
  if (ACCESS_TOKEN_EXPIRES_IN.endsWith("d")) {
    return Number.parseInt(ACCESS_TOKEN_EXPIRES_IN, 10) * 24 * 60 * 60;
  }

  if (ACCESS_TOKEN_EXPIRES_IN.endsWith("h")) {
    return Number.parseInt(ACCESS_TOKEN_EXPIRES_IN, 10) * 60 * 60;
  }

  if (ACCESS_TOKEN_EXPIRES_IN.endsWith("m")) {
    return Number.parseInt(ACCESS_TOKEN_EXPIRES_IN, 10) * 60;
  }

  return Number.parseInt(ACCESS_TOKEN_EXPIRES_IN, 10) || 0;
};

const buildAuthPayload = (user) => ({
  user: sanitizeUser(user),
  accessToken: signAccessToken(user),
  expiresIn: getExpiresInSeconds(),
});

const getAuthenticatedUser = (userId) => {
  const user = getUserWithSeller.get(userId);

  if (!user) {
    throw new AppError("User not found", 401);
  }

  return user;
};

const authenticate = (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      throw new AppError("Authorization header is required", 401);
    }

    const token = authorization.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getAuthenticatedUser(payload.userId);
    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    next(new AppError("Invalid or expired access token", 401));
  }
};

const requireSeller = (req, res, next) => {
  if (!req.user || ![ROLES.SELLER, ROLES.ADMIN].includes(req.user.role)) {
    return next(new AppError("Seller access is required", 403));
  }

  return next();
};

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, nickname, password, role, shopName } = req.body || {};

    const normalizedEmail = normalizeEmail(email);
    const normalizedNickname = normalizeNickname(nickname);
    const normalizedRole = role === ROLES.SELLER ? ROLES.SELLER : ROLES.BUYER;

    if (!normalizedEmail || !normalizedNickname || !password) {
      throw new AppError("email, nickname, and password are required", 400);
    }

    if (normalizedNickname.length < 2 || normalizedNickname.length > 20) {
      throw new AppError("nickname must be between 2 and 20 characters", 400);
    }

    if (String(password).length < 8) {
      throw new AppError("password must be at least 8 characters", 400);
    }

    if (getUserByEmail.get(normalizedEmail)) {
      throw new AppError("Email already exists", 409);
    }

    const currentTime = now();
    const userId = createId();

    db.prepare(
      `
        INSERT INTO users (id, email, nickname, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      userId,
      normalizedEmail,
      normalizedNickname,
      bcrypt.hashSync(String(password), 10),
      normalizedRole,
      currentTime,
      currentTime,
    );

    if (normalizedRole === ROLES.SELLER) {
      db.prepare(
        `
          INSERT INTO seller_profiles (id, user_id, shop_name, created_at)
          VALUES (?, ?, ?, ?)
        `,
      ).run(createId(), userId, String(shopName || `${normalizedNickname} Shop`).trim(), currentTime);
    }

    const createdUser = getAuthenticatedUser(userId);

    res.status(201).json({
      success: true,
      data: buildAuthPayload(createdUser),
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!normalizedEmail || !password) {
      throw new AppError("email and password are required", 400);
    }

    const user = getUserByEmail.get(normalizedEmail);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new AppError("Invalid email or password", 401);
    }

    res.json({
      success: true,
      data: buildAuthPayload(user),
    });
  }),
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: { message: "로그아웃 되었습니다." },
    });
  }),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: { user: req.user },
    });
  }),
);

module.exports = {
  authenticate,
  requireSeller,
  router,
};
