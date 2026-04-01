const express = require("express");
const path = require("path");
const fs = require("fs");
const { UPLOAD_DRIVER, UPLOAD_LOCAL_DIR, S3_BUCKET, S3_REGION } = require("./config");
const { AppError, asyncHandler } = require("./errors");

const router = express.Router();

// ──────────────────────────────────────────────
// Local 드라이버: data/uploads/ 에 저장, /uploads/ 로 서빙
// ──────────────────────────────────────────────
const buildLocalUpload = () => {
  const multer = require("multer");

  fs.mkdirSync(UPLOAD_LOCAL_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_LOCAL_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, uniqueName);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new AppError("이미지 파일만 업로드 가능합니다.", 400));
      }
      cb(null, true);
    },
  });

  return { upload, getResult: (req) => ({ imageUrl: `/uploads/${req.file.filename}`, key: req.file.filename }) };
};

// ──────────────────────────────────────────────
// S3 드라이버: multer-s3 + @aws-sdk/client-s3 사용
// ──────────────────────────────────────────────
const buildS3Upload = () => {
  const multer = require("multer");
  const multerS3 = require("multer-s3");
  const { S3Client } = require("@aws-sdk/client-s3");

  if (!S3_BUCKET) {
    throw new Error("S3_BUCKET 환경변수가 설정되지 않았습니다.");
  }

  const s3 = new S3Client({ region: S3_REGION });

  const upload = multer({
    storage: multerS3({
      s3,
      bucket: S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const key = `products/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, key);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new AppError("이미지 파일만 업로드 가능합니다.", 400));
      }
      cb(null, true);
    },
  });

  return {
    upload,
    getResult: (req) => ({
      imageUrl: req.file.location,
      key: req.file.key,
    }),
  };
};

// 드라이버 선택
let uploadDriver;
try {
  uploadDriver = UPLOAD_DRIVER === "s3" ? buildS3Upload() : buildLocalUpload();
} catch (err) {
  console.error("[uploads] 드라이버 초기화 실패:", err.message);
  process.exit(1);
}

// POST /api/uploads/images
router.post(
  "/images",
  (req, res, next) => {
    uploadDriver.upload.single("image")(req, res, (err) => {
      if (err) {
        return next(new AppError(err.message || "파일 업로드 실패", 400));
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("image 필드가 필요합니다.", 400);
    }

    const result = uploadDriver.getResult(req);

    res.status(201).json({
      success: true,
      data: result,
    });
  }),
);

module.exports = { router };
