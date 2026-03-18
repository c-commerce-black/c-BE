const assert = require("assert");

const app = require("../src/app");
const { db } = require("../src/db");
const { runDiscountRefreshCycle } = require("../src/discountScheduler");

const requiredTables = [
  "users",
  "seller_profiles",
  "products",
  "price_history",
  "cart_items",
  "orders",
  "order_items",
  "alerts",
];

const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
  .all()
  .map((row) => row.name);

for (const tableName of requiredTables) {
  assert(tables.includes(tableName), `Missing table: ${tableName}`);
}

assert(app, "Express app should be created");
assert(runDiscountRefreshCycle(), "Discount refresh cycle should return a summary");

console.log("Project check passed.");
