const { refreshAllProductSnapshots } = require("./productPricing");

const DEFAULT_INTERVAL_MS = 60 * 1000;

let intervalId = null;

const runDiscountRefreshCycle = () => refreshAllProductSnapshots();

const startDiscountScheduler = () => {
  if (intervalId) {
    return intervalId;
  }

  const intervalMs = Math.max(
    Number.parseInt(process.env.DISCOUNT_REFRESH_INTERVAL_MS || `${DEFAULT_INTERVAL_MS}`, 10) || DEFAULT_INTERVAL_MS,
    1000,
  );

  const logSummary = (summary) => {
    if (summary.changed === 0) {
      return;
    }

    console.log(
      `[discount-scheduler] refreshed ${summary.changed}/${summary.scanned} products (price: ${summary.priceChanges}, status: ${summary.statusChanges})`,
    );
  };

  const executeCycle = () => {
    try {
      const summary = runDiscountRefreshCycle();
      logSummary(summary);
    } catch (error) {
      console.error("[discount-scheduler] refresh failed", error);
    }
  };

  executeCycle();
  intervalId = setInterval(executeCycle, intervalMs);
  if (typeof intervalId.unref === "function") {
    intervalId.unref();
  }

  return intervalId;
};

const stopDiscountScheduler = () => {
  if (!intervalId) {
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
};

module.exports = {
  runDiscountRefreshCycle,
  startDiscountScheduler,
  stopDiscountScheduler,
};
