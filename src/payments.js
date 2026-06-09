const express = require("express");
const crypto = require("crypto");
const { DEFAULT_PAYMENT_TOKEN } = require("./config");
const { authenticate } = require("./auth");
const { db } = require("./db");
const { AppError, asyncHandler } = require("./errors");
const { ensurePaymentProfile, selectPaymentProfileByUserId } = require("./payment-profiles");
const { createTransfer, StablecoinApiError } = require("./stablecoin");
const { createId, now } = require("./utils");

const router = express.Router();

const selectPaymentProfilesByWalletIds = db.prepare(
  `SELECT * FROM payment_profiles WHERE wallet_id IN (?, ?)`,
);
const selectPaymentsByOrderId = db.prepare(`
  SELECT
    p.*,
    sp.shop_name,
    u.nickname AS payee_nickname
  FROM payments p
  JOIN seller_profiles sp ON sp.id = p.seller_id
  JOIN users u ON u.id = p.payee_user_id
  WHERE p.order_id = ?
  ORDER BY p.created_at ASC, p.id ASC
`);
const selectPaymentsByUserId = db.prepare(`
  SELECT
    p.*,
    sp.shop_name,
    seller.nickname AS payee_nickname,
    payer.nickname AS payer_nickname
  FROM payments p
  JOIN seller_profiles sp ON sp.id = p.seller_id
  JOIN users seller ON seller.id = p.payee_user_id
  JOIN users payer ON payer.id = p.payer_user_id
  WHERE p.payer_user_id = ? OR p.payee_user_id = ?
  ORDER BY p.created_at DESC, p.id DESC
`);
const selectOrderById = db.prepare(`SELECT * FROM orders WHERE id = ?`);
const selectUserOrder = db.prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`);
const selectOrderItemsWithSeller = db.prepare(`
  SELECT
    oi.*,
    sp.user_id AS seller_user_id,
    sp.shop_name
  FROM order_items oi
  JOIN seller_profiles sp ON sp.id = oi.seller_id
  WHERE oi.order_id = ?
  ORDER BY oi.id ASC
`);

const insertPaymentStatement = db.prepare(`
  INSERT OR IGNORE INTO payments (
    id, order_id, seller_id, payer_user_id, payee_user_id, src_wallet_id, dst_wallet_id, token,
    amount, reference_id, status, stablecoin_transfer_id, error_message, raw_response, created_at, updated_at, paid_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, NULL, ?, ?, NULL)
`);

const refreshPendingPaymentStatement = db.prepare(`
  UPDATE payments
  SET
    src_wallet_id = ?,
    dst_wallet_id = ?,
    token = ?,
    amount = ?,
    updated_at = ?
  WHERE reference_id = ? AND status != 'COMPLETED'
`);

const updatePaymentStatement = db.prepare(`
  UPDATE payments
  SET status = ?, stablecoin_transfer_id = ?, error_message = ?, raw_response = ?, updated_at = ?, paid_at = ?
  WHERE id = ?
`);

const formatPaymentProfile = (profile) =>
  profile
    ? {
        walletId: profile.wallet_id,
        token: profile.token,
        balance: profile.balance,
        updatedAt: profile.updated_at,
      }
    : null;

const formatPaymentRecord = (payment, viewerUserId = null) => ({
  id: payment.id,
  orderId: payment.order_id,
  sellerId: payment.seller_id,
  sellerShopName: payment.shop_name,
  payeeNickname: payment.payee_nickname,
  payerNickname: payment.payer_nickname || null,
  token: payment.token,
  amount: payment.amount,
  status: payment.status,
  referenceId: payment.reference_id,
  transferId: payment.stablecoin_transfer_id,
  errorMessage: payment.error_message,
  direction:
    viewerUserId && payment.payer_user_id === viewerUserId
      ? "OUT"
      : viewerUserId && payment.payee_user_id === viewerUserId
        ? "IN"
        : null,
  counterparty:
    viewerUserId && payment.payer_user_id === viewerUserId
      ? payment.shop_name
      : viewerUserId && payment.payee_user_id === viewerUserId
        ? payment.payer_nickname
        : null,
  paidAt: payment.paid_at,
  updatedAt: payment.updated_at,
});

const deriveOrderPaymentStatus = (payments) => {
  if (!payments.length) {
    return "UNPAID";
  }

  const completedCount = payments.filter((payment) => payment.status === "COMPLETED").length;

  if (completedCount === payments.length) {
    return "PAID";
  }

  if (completedCount > 0) {
    return "PARTIAL";
  }

  if (payments.some((payment) => payment.status === "FAILED")) {
    return "FAILED";
  }

  return "UNPAID";
};

const syncOrderPaymentState = (orderId) => {
  const paymentRows = selectPaymentsByOrderId.all(orderId);
  const paymentStatus = deriveOrderPaymentStatus(paymentRows);
  const paidAt =
    paymentStatus === "PAID"
      ? paymentRows.reduce((latest, payment) => Math.max(latest, payment.paid_at || 0), 0) || null
      : null;

  db.prepare(`UPDATE orders SET payment_status = ?, paid_at = ?, updated_at = ? WHERE id = ?`).run(
    paymentStatus,
    paidAt,
    now(),
    orderId,
  );

  return paymentStatus;
};

const ensurePaymentReference = (orderId, sellerId) =>
  `ord_${crypto.createHash("sha256").update(`${orderId}:${sellerId}`).digest("hex").slice(0, 24)}`;

const groupOrderPayments = (orderId, payerUserId) => {
  const order = selectOrderById.get(orderId);
  if (!order) {
    throw new AppError("주문을 찾을 수 없습니다.", 404);
  }

  const payerProfile = ensurePaymentProfile(payerUserId);

  const items = selectOrderItemsWithSeller.all(orderId);
  if (!items.length) {
    throw new AppError("결제할 주문 항목이 없습니다.", 400);
  }

  const groupedBySeller = new Map();

  for (const item of items) {
    if (item.seller_user_id === payerUserId) {
      throw new AppError("본인이 등록한 상품은 결제할 수 없습니다.", 400);
    }

    const existing = groupedBySeller.get(item.seller_id) || {
      sellerId: item.seller_id,
      payeeUserId: item.seller_user_id,
      shopName: item.shop_name,
      amount: 0,
    };
    existing.amount += item.price * item.quantity;
    groupedBySeller.set(item.seller_id, existing);
  }

  return Array.from(groupedBySeller.values()).map((group) => {
    const payeeProfile = ensurePaymentProfile(group.payeeUserId);

    if (payeeProfile.token !== payerProfile.token) {
      throw new AppError(`${group.shopName} 판매자의 정산 토큰이 구매자 토큰과 다릅니다.`, 400);
    }

    return {
      sellerId: group.sellerId,
      payeeUserId: group.payeeUserId,
      shopName: group.shopName,
      amount: group.amount,
      srcWalletId: payerProfile.wallet_id,
      dstWalletId: payeeProfile.wallet_id,
      token: payerProfile.token,
      referenceId: ensurePaymentReference(orderId, group.sellerId),
    };
  });
};

const preparePaymentRecords = db.transaction(({ orderId, payerUserId, groups }) => {
  const currentTime = now();

  for (const group of groups) {
    insertPaymentStatement.run(
      createId(),
      orderId,
      group.sellerId,
      payerUserId,
      group.payeeUserId,
      group.srcWalletId,
      group.dstWalletId,
      group.token,
      group.amount,
      group.referenceId,
      currentTime,
      currentTime,
    );

    refreshPendingPaymentStatement.run(
      group.srcWalletId,
      group.dstWalletId,
      group.token,
      group.amount,
      currentTime,
      group.referenceId,
    );
  }

  return selectPaymentsByOrderId.all(orderId);
});

const applyWalletBalanceTransfer = db.transaction(({ srcWalletId, dstWalletId, amount }) => {
  if (srcWalletId === dstWalletId) {
    throw new AppError("동일한 지갑으로는 결제할 수 없습니다.", 400);
  }

  const profiles = selectPaymentProfilesByWalletIds.all(srcWalletId, dstWalletId);
  const srcProfile = profiles.find((profile) => profile.wallet_id === srcWalletId);
  const dstProfile = profiles.find((profile) => profile.wallet_id === dstWalletId);

  if (!srcProfile || !dstProfile) {
    throw new AppError("결제 지갑 정보를 다시 확인해 주세요.", 400);
  }

  if (srcProfile.balance < amount) {
    throw new AppError(`지갑 잔액이 부족합니다. balance=${srcProfile.balance} need=${amount}`, 400);
  }

  const currentTime = now();
  db.prepare(`UPDATE payment_profiles SET balance = ?, updated_at = ? WHERE id = ?`).run(
    srcProfile.balance - amount,
    currentTime,
    srcProfile.id,
  );
  db.prepare(`UPDATE payment_profiles SET balance = ?, updated_at = ? WHERE id = ?`).run(
    dstProfile.balance + amount,
    currentTime,
    dstProfile.id,
  );
});

const executeOrderPayment = async ({ orderId, payerUserId }) => {
  const order = selectUserOrder.get(orderId, payerUserId);
  if (!order) {
    throw new AppError("주문을 찾을 수 없습니다.", 404);
  }

  if (order.status === "CANCELLED") {
    throw new AppError("취소된 주문은 결제할 수 없습니다.", 400);
  }

  if (order.payment_status === "PAID") {
    return {
      order: selectUserOrder.get(orderId, payerUserId),
      payments: selectPaymentsByOrderId.all(orderId),
    };
  }

  const paymentGroups = groupOrderPayments(orderId, payerUserId);
  const paymentRows = preparePaymentRecords({ orderId, payerUserId, groups: paymentGroups });

  for (const payment of paymentRows) {
    if (payment.status === "COMPLETED") {
      continue;
    }

    const currentTime = now();
    let debitApplied = false;

    try {
      applyWalletBalanceTransfer({
        srcWalletId: payment.src_wallet_id,
        dstWalletId: payment.dst_wallet_id,
        amount: payment.amount,
      });
      debitApplied = true;

      const response = await createTransfer({
        src_wallet_id: payment.src_wallet_id,
        dst_wallet_id: payment.dst_wallet_id,
        token: payment.token,
        amount: String(payment.amount),
        reference_id: payment.reference_id,
        memo: `order:${orderId}`,
      });

      updatePaymentStatement.run(
        "COMPLETED",
        response.transfer_id || response.id || null,
        null,
        JSON.stringify(response),
        currentTime,
        currentTime,
        payment.id,
      );
    } catch (error) {
      if (debitApplied) {
        try {
          applyWalletBalanceTransfer({
            srcWalletId: payment.dst_wallet_id,
            dstWalletId: payment.src_wallet_id,
            amount: payment.amount,
          });
        } catch (rollbackError) {
          // Keep the original payment failure response, but preserve the rollback issue for debugging.
          console.error("payment balance rollback failed", rollbackError);
        }
      }

      const message =
        error instanceof StablecoinApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "stablecoin payment failed";
      const rawResponse =
        error instanceof StablecoinApiError && error.responseBody ? JSON.stringify(error.responseBody) : null;

      updatePaymentStatement.run("FAILED", null, message, rawResponse, currentTime, null, payment.id);
    }
  }

  syncOrderPaymentState(orderId);

  return {
    order: selectUserOrder.get(orderId, payerUserId),
    payments: selectPaymentsByOrderId.all(orderId),
  };
};

router.use(authenticate);

/**
 * @openapi
 * /api/payments/profile:
 *   get:
 *     summary: 내 결제 지갑 정보 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 등록된 결제 지갑 정보
 */
router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const paymentProfile = ensurePaymentProfile(req.user.id);

    res.json({
      success: true,
      data: {
        paymentProfile: formatPaymentProfile(paymentProfile),
      },
    });
  }),
);

/**
 * @openapi
 * /api/payments/profile:
 *   post:
 *     summary: 내 결제 지갑 정보 보장
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 */
router.post(
  "/profile",
  asyncHandler(async (req, res) => {
    const paymentProfile = ensurePaymentProfile(req.user.id);

    res.json({
      success: true,
      data: {
        paymentProfile: formatPaymentProfile({
          ...paymentProfile,
          token: paymentProfile.token || DEFAULT_PAYMENT_TOKEN,
        }),
      },
    });
  }),
);

router.get(
  "/history",
  asyncHandler(async (req, res) => {
    const payments = selectPaymentsByUserId
      .all(req.user.id, req.user.id)
      .map((payment) => formatPaymentRecord(payment, req.user.id));

    res.json({
      success: true,
      data: {
        payments,
      },
    });
  }),
);

module.exports = {
  executeOrderPayment,
  formatPaymentRecord,
  formatPaymentProfile,
  router,
  selectPaymentsByOrderId,
  selectPaymentsByUserId,
  syncOrderPaymentState,
};
