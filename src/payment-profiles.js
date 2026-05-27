const { DEFAULT_PAYMENT_BALANCE, DEFAULT_PAYMENT_TOKEN } = require("./config");
const { db } = require("./db");
const { createId, now } = require("./utils");

const selectPaymentProfileByUserId = db.prepare(`SELECT * FROM payment_profiles WHERE user_id = ?`);
const updatePaymentProfileStatement = db.prepare(`
  UPDATE payment_profiles
  SET wallet_id = ?, token = ?, updated_at = ?
  WHERE id = ?
`);
const insertPaymentProfileStatement = db.prepare(`
  INSERT INTO payment_profiles (id, user_id, wallet_id, token, balance, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const createWalletId = (userId) => `wallet_${userId.replace(/-/g, "").slice(0, 20)}`;

const createPaymentProfile = db.transaction((userId) => {
  const existingProfile = selectPaymentProfileByUserId.get(userId);
  if (existingProfile) {
    const canonicalWalletId = createWalletId(userId);
    if (
      existingProfile.wallet_id !== canonicalWalletId ||
      existingProfile.token !== DEFAULT_PAYMENT_TOKEN
    ) {
      updatePaymentProfileStatement.run(
        canonicalWalletId,
        DEFAULT_PAYMENT_TOKEN,
        now(),
        existingProfile.id,
      );
      return selectPaymentProfileByUserId.get(userId);
    }

    return existingProfile;
  }

  const currentTime = now();
  insertPaymentProfileStatement.run(
    createId(),
    userId,
    createWalletId(userId),
    DEFAULT_PAYMENT_TOKEN,
    DEFAULT_PAYMENT_BALANCE,
    currentTime,
    currentTime,
  );

  return selectPaymentProfileByUserId.get(userId);
});

const ensurePaymentProfile = (userId) => createPaymentProfile(userId);

module.exports = {
  ensurePaymentProfile,
  selectPaymentProfileByUserId,
};
