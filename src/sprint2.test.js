const app = require("./app");

describe("Sprint 2 API Tests (장바구니 관리 + 주문 관리)", () => {
  let server;
  let baseUrl;
  let buyerToken = "";
  let sellerToken = "";
  let productId = "";
  let cartItemId = "";
  let orderId = "";

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
      body: JSON.stringify({ email: `s2-seller-${sfx}@ex.com`, nickname: "sel", password: "password123" }),
    });
    sellerToken = (await sRes.json()).data.accessToken;

    // 2. Add Product
    const pRes = await fetch(`${baseUrl}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ name: "Apple", description: "Fresh", category: "FOOD", originalPrice: 5000, stock: 10, expiryDate: "2030-10-10" }),
    });
    productId = (await pRes.json()).data.product.id;

    // 3. Buyer Register
    const bRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `s2-buyer-${sfx}@ex.com`, nickname: "buy", password: "password123" }),
    });
    buyerToken = (await bRes.json()).data.accessToken;
  });

  afterAll((done) => {
    server.close(done);
  });

  test("1. 장바구니에 상품 추가 (POST /api/cart)", async () => {
    const res = await fetch(`${baseUrl}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ productId, quantity: 2 }),
    });
    const payload = await res.json();
    expect(res.status).toBe(201);
    expect(payload.success).toBe(true);
    cartItemId = payload.data.cartItem.id;
  });

  test("2. 장바구니 조회 (GET /api/cart)", async () => {
    const res = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.items.length).toBeGreaterThan(0);
  });

  test("3. 장바구니 수량 변경 (PATCH /api/cart/:cartItemId)", async () => {
    const res = await fetch(`${baseUrl}/api/cart/${cartItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ quantity: 3 }),
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.cartItem.quantity).toBe(3);
  });

  test("4. 주문 생성 (POST /api/orders)", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ cartItemIds: [cartItemId], shippingAddress: "Seoul" }),
    });
    const payload = await res.json();
    expect(res.status).toBe(201);
    expect(payload.success).toBe(true);
    orderId = payload.data.order.id;
  });

  test("5. 주문 목록 조회 (GET /api/orders)", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.orders.length).toBeGreaterThan(0);
  });

  test("6. 주문 상세 조회 (GET /api/orders/:orderId)", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.data.order.id).toBe(orderId);
  });

  test("7. 주문 취소 (PATCH /api/orders/:orderId/cancel)", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` }
    });
    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
  });

  test("8. 장바구니 항목 개별 삭제 및 전체 비우기 (DELETE /api/cart)", async () => {
    const addRes = await fetch(`${baseUrl}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const addPayload = await addRes.json();
    const tempCartItemId = addPayload.data.cartItem.id;

    const delRes = await fetch(`${baseUrl}/api/cart/${tempCartItemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    expect(delRes.status).toBe(200);

    const clearRes = await fetch(`${baseUrl}/api/cart`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    expect(clearRes.status).toBe(200);
  });
});
