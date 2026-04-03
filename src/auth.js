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

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               nickname: { type: string }
 *               password: { type: string }
 *               shopName: { type: string }
 *               agreements:
 *                 type: object
 *                 properties:
 *                   terms: { type: boolean }
 *                   privacy: { type: boolean }
 *                   marketing: { type: boolean }
 *     responses:
 *       201:
 *         description: 회원가입 성공
 */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, nickname, password, shopName, agreements } = req.body || {};

    const normalizedEmail = normalizeEmail(email);
    const normalizedNickname = normalizeNickname(nickname);

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

    // 약관 동의 검증 (agreements가 주어진 경우에만)
    if (agreements !== undefined) {
      if (!agreements.terms) {
        throw new AppError("서비스 이용약관에 동의가 필요합니다.", 400);
      }
      if (!agreements.privacy) {
        throw new AppError("개인정보 처리방침에 동의가 필요합니다.", 400);
      }
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
      ROLES.USER,
      currentTime,
      currentTime,
    );

    // 누구나 판매할 수 있도록 seller_profile 자동 생성 (당근마켓 방식)
    const resolvedShopName = String(shopName || `${normalizedNickname} Shop`).trim();
    db.prepare(
      `
        INSERT INTO seller_profiles (id, user_id, shop_name, created_at)
        VALUES (?, ?, ?, ?)
      `,
    ).run(createId(), userId, resolvedShopName, currentTime);

    // 약관 동의 저장 (agreements가 주어진 경우에만)
    if (agreements !== undefined) {
      db.prepare(
        `INSERT INTO user_agreements (id, user_id, terms, privacy, marketing, agreed_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        createId(),
        userId,
        agreements.terms ? 1 : 0,
        agreements.privacy ? 1 : 0,
        agreements.marketing ? 1 : 0,
        currentTime,
      );
    }

    const createdUser = getAuthenticatedUser(userId);

    res.status(201).json({
      success: true,
      data: buildAuthPayload(createdUser),
    });
  }),
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 사용자를 인증하고 액세스 토큰을 발급합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: 로그인 성공
 */
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

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: 인증된 사용자를 로그아웃 처리합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
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

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회
 *     description: 인증된 사용자의 정보를 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 내 정보 반환
 */
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
  router,
};
