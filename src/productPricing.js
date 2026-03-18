const { db } = require("./db");
const { buildProductState } = require("./domain");
const { createId, now } = require("./utils");

const selectProductSnapshotRow = db.prepare(
  `SELECT id, original_price, current_price, stock, expiry_date, status, deleted_at FROM products WHERE id = ?`,
);

const selectAllProductSnapshotRows = db.prepare(
  `SELECT id, original_price, current_price, stock, expiry_date, status, deleted_at FROM products`,
);

const updateProductSnapshotStatement = db.prepare(
  `UPDATE products SET current_price = ?, status = ?, updated_at = ? WHERE id = ?`,
);

const insertPriceHistoryStatement = db.prepare(
  `INSERT INTO price_history (id, product_id, price, d_day, created_at) VALUES (?, ?, ?, ?, ?)`,
);

const syncProductSnapshot = (productRow, options = {}) => {
  const { recordPriceHistory = true, timestamp = now() } = options;
  const state = buildProductState(productRow);
  const priceChanged = state.currentPrice !== productRow.current_price;
  const statusChanged = state.status !== productRow.status;

  if (!priceChanged && !statusChanged) {
    return {
      ...state,
      changed: false,
      priceChanged,
      statusChanged,
    };
  }

  updateProductSnapshotStatement.run(state.currentPrice, state.status, timestamp, productRow.id);

  if (priceChanged && recordPriceHistory) {
    insertPriceHistoryStatement.run(createId(), productRow.id, state.currentPrice, state.dDay, timestamp);
  }

  return {
    ...state,
    changed: true,
    priceChanged,
    statusChanged,
  };
};

const syncProductSnapshotById = (productId, options = {}) => {
  const productRow = selectProductSnapshotRow.get(productId);

  if (!productRow) {
    return null;
  }

  return syncProductSnapshot(productRow, options);
};

const refreshAllProductSnapshots = db.transaction((options = {}) => {
  const timestamp = options.timestamp || now();
  const rows = selectAllProductSnapshotRows.all();
  const summary = {
    scanned: rows.length,
    changed: 0,
    priceChanges: 0,
    statusChanges: 0,
    ranAt: timestamp,
  };

  for (const row of rows) {
    const result = syncProductSnapshot(row, {
      recordPriceHistory: true,
      timestamp,
    });

    if (!result.changed) {
      continue;
    }

    summary.changed += 1;
    if (result.priceChanged) {
      summary.priceChanges += 1;
    }
    if (result.statusChanged) {
      summary.statusChanges += 1;
    }
  }

  return summary;
});

module.exports = {
  refreshAllProductSnapshots,
  syncProductSnapshot,
  syncProductSnapshotById,
};
