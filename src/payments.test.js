const app = require("./app");
const { db } = require("./db");

describe("Payment API Tests", () => {
  let server;
  let baseUrl;
  let buyerToken = "";
  let sellerToken = "";
  let orderId = "";

  beforeAll(async () => {
    server = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const sellerRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `payment-seller-${suffix}@ex.com`, nickname: "sellerP", password: "password123" }),
    });
    sellerToken = (await sellerRegister.json()).data.accessToken;

    const buyerRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `payment-buyer-${suffix}@ex.com`, nickname: "buyerP", password: "password123" }),
    });
    buyerToken = (await buyerRegister.json()).data.accessToken;

    const productRes = await fetch(`${baseUrl}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: "Payment Apple",
        description: "Fresh",
        category: "FOOD",
        originalPrice: 4000,
        stock: 10,
        expiryDate: "2031-01-01",
      }),
    });
    const productId = (await productRes.json()).data.product.id;

    await fetch(`${baseUrl}/api/payments/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerToken}` },
    });

    await fetch(`${baseUrl}/api/payments/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
    });

    const cartRes = await fetch(`${baseUrl}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ productId, quantity: 2 }),
    });
    const cartItemId = (await cartRes.json()).data.cartItem.id;

    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ cartItemIds: [cartItemId], shippingAddress: "Daegu" }),
    });
    orderId = (await orderRes.json()).data.order.id;
  });

  afterAll((done) => {
    server.close(done);
  });

  test("1. 결제 프로필 조회", async () => {
    const res = await fetch(`${baseUrl}/api/payments/profile`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.paymentProfile.walletId).toContain("wallet_");
    expect(payload.data.paymentProfile).toHaveProperty("depositAddress");
  });

  test("2. 주문 결제", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.order.paymentStatus).toBe("PAID");
    expect(payload.data.payments[0].status).toBe("COMPLETED");
    expect(payload.data.payments[0].amount).toBe(payload.data.order.finalAmount);
    const paymentRow = db.prepare("SELECT raw_response FROM payments WHERE id = ?").get(payload.data.payments[0].id);
    expect(JSON.parse(paymentRow.raw_response).amount).toBe(String(payload.data.order.finalAmount));
  });

  test("3. 결제된 주문은 취소 불가", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(400);
    expect(payload.success).toBe(false);
  });
});
