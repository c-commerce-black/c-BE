const express = require("express");
const { db } = require("./db");
const { AppError, asyncHandler } = require("./errors");
const { authenticate } = require("./auth");
const { buildProductState, decorateProductRow, getRemainSeconds } = require("./domain");
const { createId, now } = require("./utils");

const router = express.Router();

const selectAlertById = db.prepare(`SELECT * FROM alerts WHERE id = ? AND user_id = ?`);
const selectProductById = db.prepare(`
  SELECT p.*, sp.shop_name
  FROM products p
  JOIN seller_profiles sp ON sp.id = p.seller_id
  WHERE p.id = ?
`);

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const wishAlerts = db
      .prepare(
        `
          SELECT a.id AS alert_id, a.is_on, p.*, sp.shop_name
          FROM alerts a
          JOIN products p ON p.id = a.product_id
          JOIN seller_profiles sp ON sp.id = p.seller_id
          WHERE a.user_id = ?
          ORDER BY a.created_at DESC
        `,
      )
      .all(req.user.id)
      .map((row) => ({
        alertId: row.alert_id,
        isOn: Boolean(row.is_on),
        product: {
          ...decorateProductRow(row),
          remainSeconds: getRemainSeconds(row.expiry_date),
        },
      }));

    const todayDeals = db
      .prepare(
        `
          SELECT p.*, sp.shop_name, a.id AS alert_id, a.is_on
          FROM products p
          JOIN seller_profiles sp ON sp.id = p.seller_id
          LEFT JOIN alerts a ON a.product_id = p.id AND a.user_id = ?
          WHERE p.deleted_at IS NULL
        `,
      )
      .all(req.user.id)
      .filter((row) => {
        const state = buildProductState(row);
        return !["DELETED", "EXPIRED"].includes(state.status) && [0, 1].includes(state.dDay);
      })
      .map((row) => ({
        alertId: row.alert_id || null,
        isOn: row.alert_id ? Boolean(row.is_on) : false,
        product: {
          ...decorateProductRow(row),
          remainSeconds: getRemainSeconds(row.expiry_date),
        },
      }));

    res.json({
      success: true,
      data: { wishAlerts, todayDeals },
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const productId = req.body?.productId;
    const product = selectProductById.get(productId);

    if (!product) {
      throw new AppError("상품을 찾을 수 없습니다.", 404);
    }

    const existing = db.prepare(`SELECT id FROM alerts WHERE user_id = ? AND product_id = ?`).get(req.user.id, productId);
    if (existing) {
      throw new AppError("이미 찜한 상품입니다.", 409);
    }

    const alertId = createId();
    const currentTime = now();
    db.prepare(
      `INSERT INTO alerts (id, user_id, product_id, is_on, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)`,
    ).run(alertId, req.user.id, productId, currentTime, currentTime);

    res.status(201).json({
      success: true,
      data: { alert: { id: alertId, productId, isOn: true } },
    });
  }),
);

router.patch(
  "/:alertId/toggle",
  asyncHandler(async (req, res) => {
    const alert = selectAlertById.get(req.params.alertId, req.user.id);
    if (!alert) {
      throw new AppError("알림을 찾을 수 없습니다.", 404);
    }

    const nextValue = alert.is_on ? 0 : 1;
    db.prepare(`UPDATE alerts SET is_on = ?, updated_at = ? WHERE id = ?`).run(nextValue, now(), alert.id);

    res.json({
      success: true,
      data: { alert: { id: alert.id, isOn: Boolean(nextValue) } },
    });
  }),
);

router.delete(
  "/:alertId",
  asyncHandler(async (req, res) => {
    const result = db.prepare(`DELETE FROM alerts WHERE id = ? AND user_id = ?`).run(req.params.alertId, req.user.id);
    if (!result.changes) {
      throw new AppError("알림을 찾을 수 없습니다.", 404);
    }

    res.json({
      success: true,
      data: { message: "찜이 해제되었습니다." },
    });
  }),
);

module.exports = {
  router,
};
