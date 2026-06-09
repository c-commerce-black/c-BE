const { DEFAULT_PAYMENT_BALANCE, DEFAULT_PAYMENT_TOKEN, STABLECOIN_DRIVER } = require("./config");
const { db } = require("./db");
const { createWallet } = require("./stablecoin");
const { createId, now } = require("./utils");

const selectPaymentProfileByUserId = db.prepare(`SELECT * FROM payment_profiles WHERE user_id = ?`);
const updatePaymentProfileStatement = db.prepare(`
  UPDATE payment_profiles
  SET wallet_id = ?, deposit_address = ?, token = ?, updated_at = ?
  WHERE id = ?
`);
const insertPaymentProfileStatement = db.prepare(`
  INSERT INTO payment_profiles (id, user_id, wallet_id, deposit_address, token, balance, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        existingProfile.deposit_address || null,
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
    null,
    DEFAULT_PAYMENT_TOKEN,
    DEFAULT_PAYMENT_BALANCE,
    currentTime,
    currentTime,
  );

  return selectPaymentProfileByUserId.get(userId);
});

const ensurePaymentProfile = (userId) => createPaymentProfile(userId);

const updateStablecoinWalletStatement = db.prepare(`
  UPDATE payment_profiles
  SET wallet_id = ?, deposit_address = ?, token = ?, updated_at = ?
  WHERE id = ?
`);

const ensureStablecoinPaymentProfile = async (userId) => {
  const paymentProfile = ensurePaymentProfile(userId);

  if (STABLECOIN_DRIVER !== "stablecoin" || paymentProfile.deposit_address) {
    return paymentProfile;
  }

  const wallet = await createWallet({ label: `c-commerce-${userId}` });
  const walletId = wallet?.wallet_id || wallet?.walletId;
  const depositAddress = wallet?.deposit_address || wallet?.depositAddress;

  if (!walletId || !depositAddress) {
    throw new Error("stablecoin wallet response is missing wallet_id or deposit_address");
  }

  updateStablecoinWalletStatement.run(
    walletId,
    depositAddress,
    paymentProfile.token || DEFAULT_PAYMENT_TOKEN,
    now(),
    paymentProfile.id,
  );

  return selectPaymentProfileByUserId.get(userId);
};

module.exports = {
  ensurePaymentProfile,
  ensureStablecoinPaymentProfile,
  selectPaymentProfileByUserId,
};
