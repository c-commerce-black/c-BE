jest.mock("./stablecoin", () => {
  const actual = jest.requireActual("./stablecoin");
  return {
    ...actual,
    createTransfer: jest.fn(async () => {
      throw new actual.StablecoinApiError("forced stablecoin failure", 502, {
        message: "forced stablecoin failure",
      });
    }),
  };
});

const app = require("./app");
const { db } = require("./db");

const jsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const register = async (baseUrl, emailPrefix) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `${emailPrefix}-${suffix}@ex.com`,
      nickname: emailPrefix.slice(0, 20),
      password: "password123",
    }),
  });
  const payload = await res.json();
  return {
    token: payload.data.accessToken,
    user: payload.data.user,
  };
};

describe("Payment rollback integration tests", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll((done) => {
    server.close(done);
  });

  test("외부 stablecoin 전송 실패 시 차감된 구매자/판매자 잔액을 원복한다", async () => {
    const seller = await register(baseUrl, "remote-fail-seller");
    const buyer = await register(baseUrl, "remote-fail-buyer");

    const productRes = await fetch(`${baseUrl}/api/seller/products`, {
      method: "POST",
      headers: jsonHeaders(seller.token),
      body: JSON.stringify({
        name: "Rollback Product",
        description: "For rollback test",
        category: "FOOD",
        originalPrice: 4000,
        stock: 10,
        expiryDate: "2031-01-01",
      }),
    });
    const productId = (await productRes.json()).data.product.id;

    await fetch(`${baseUrl}/api/payments/profile`, {
      method: "POST",
      headers: jsonHeaders(seller.token),
    });
    await fetch(`${baseUrl}/api/payments/profile`, {
      method: "POST",
      headers: jsonHeaders(buyer.token),
    });

    const beforeBuyer = db.prepare("SELECT balance FROM payment_profiles WHERE user_id = ?").get(buyer.user.id).balance;
    const beforeSeller = db.prepare("SELECT balance FROM payment_profiles WHERE user_id = ?").get(seller.user.id).balance;

    const cartRes = await fetch(`${baseUrl}/api/cart`, {
      method: "POST",
      headers: jsonHeaders(buyer.token),
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const cartItemId = (await cartRes.json()).data.cartItem.id;

    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: jsonHeaders(buyer.token),
      body: JSON.stringify({ cartItemIds: [cartItemId], shippingAddress: "Seoul" }),
    });
    const orderId = (await orderRes.json()).data.order.id;

    const payRes = await fetch(`${baseUrl}/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: jsonHeaders(buyer.token),
    });
    const payPayload = await payRes.json();

    const afterBuyer = db.prepare("SELECT balance FROM payment_profiles WHERE user_id = ?").get(buyer.user.id).balance;
    const afterSeller = db.prepare("SELECT balance FROM payment_profiles WHERE user_id = ?").get(seller.user.id).balance;

    expect(payRes.status).toBe(200);
    expect(payPayload.data.order.paymentStatus).toBe("FAILED");
    expect(payPayload.data.payments[0].status).toBe("FAILED");
    expect(afterBuyer).toBe(beforeBuyer);
    expect(afterSeller).toBe(beforeSeller);
  });
});
