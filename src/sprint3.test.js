const app = require("./app");
const { runDiscountRefreshCycle } = require("./discountScheduler");

describe("Sprint 3 API Tests (알림 + 스케줄러 + 배송상태 변경)", () => {
  let server;
  let baseUrl;
  let sellerToken = "";
  let buyerToken = "";
  let productId = "";
  let orderId = "";
  let alertId = "";

  beforeAll(async () => {
    server = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const sfx = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    // 1. Seller Register
    const sRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `s3-seller-${sfx}@ex.com`, nickname: "sel3", password: "password123" }),
    });
    sellerToken = (await sRes.json()).data.accessToken;

    // 2. Add Product
    // dDay를 넉넉하게 하여 만료되지 않도록 설정
    const pRes = await fetch(`${baseUrl}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ name: "Banana", description: "Yellow", category: "FOOD", originalPrice: 3000, stock: 50, expiryDate: "2030-12-31" }),
    });
    productId = (await pRes.json()).data.product.id;

    // 3. Buyer Register
    const bRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `s3-buyer-${sfx}@ex.com`, nickname: "buy3", password: "password123" }),
    });
    buyerToken = (await bRes.json()).data.accessToken;

    // 4. Create an Order for Delivery test
    const cartRes = await fetch(`${baseUrl}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const cartItemId = (await cartRes.json()).data.cartItem.id;

    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ cartItemIds: [cartItemId], shippingAddress: "Busan" }),
    });
    orderId = (await orderRes.json()).data.order.id;
  });

  afterAll((done) => {
    if (!server) {
      return done();
    }

    server.close(done);
  });

  // ========== 배송 상태 변경 ==========
  test("1. 배송 상태 변경 (PATCH /api/orders/:id/status)", async () => {
    // PENDING -> PREPARING
    let res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ status: "PREPARING" }),
    });
    let payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.order.status).toBe("PREPARING");

    // PREPARING -> SHIPPING
    res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ status: "SHIPPING" }),
    });
    payload = await res.json();
    expect(payload.data.order.status).toBe("SHIPPING");

    // SHIPPING -> DELIVERED
    res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ status: "DELIVERED" }),
    });
    payload = await res.json();
    expect(payload.data.order.status).toBe("DELIVERED");
  });

  // ========== 알림(찜) ==========
  test("2. 찜 등록 (POST /api/alerts)", async () => {
    const res = await fetch(`${baseUrl}/api/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ productId }),
    });
    const payload = await res.json();
    expect(res.status).toBe(201);
    expect(payload.success).toBe(true);
    alertId = payload.data.alert.id;
    expect(payload.data.alert.isOn).toBe(true);
  });

  test("3. 알림 목록 조회 (GET /api/alerts)", async () => {
    const res = await fetch(`${baseUrl}/api/alerts`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.wishAlerts.length).toBeGreaterThan(0);
    expect(payload.data.wishAlerts[0].product.id).toBe(productId);
  });

  test("4. 알림 On/Off 토글 (PATCH /api/alerts/:alertId/toggle)", async () => {
    // Toggle Off
    let res = await fetch(`${baseUrl}/api/alerts/${alertId}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    let payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.alert.isOn).toBe(false);

    // Toggle On
    res = await fetch(`${baseUrl}/api/alerts/${alertId}/toggle`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    payload = await res.json();
    expect(payload.data.alert.isOn).toBe(true);
  });

  test("5. 찜 해제 (DELETE /api/alerts/:alertId)", async () => {
    const res = await fetch(`${baseUrl}/api/alerts/${alertId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
  });

  // ========== 스케줄러 ==========
  test("6. 자동 할인 가격 스케줄러 (discountScheduler)", () => {
    // 스케줄러 함수가 에러 없이 실행되고 요약 객체를 반환하는지 테스트
    const summary = runDiscountRefreshCycle();
    expect(summary).toHaveProperty("scanned");
    expect(summary).toHaveProperty("changed");
    expect(summary).toHaveProperty("priceChanges");
    expect(summary).toHaveProperty("statusChanges");
  });
});
