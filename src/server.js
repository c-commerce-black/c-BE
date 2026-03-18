const app = require("./app");
const { PORT } = require("./config");
const { startDiscountScheduler } = require("./discountScheduler");

startDiscountScheduler();

app.listen(PORT, () => {
  console.log(`C-commerce backend listening on port ${PORT}`);
});
