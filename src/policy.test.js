const app = require("./app");
const { db } = require("./db");
const { createId, now } = require("./utils");

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

const createProduct = async (baseUrl, token, overrides = {}) => {
  const res = await fetch(`${baseUrl}/api/seller/products`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({
      name: "Policy Product",
      description: "For policy tests",
      category: "FOOD",
      originalPrice: 4000,
      stock: 10,
      expiryDate: "2031-01-01",
      ...overrides,
    }),
  });
  const payload = await res.json();
  expect(res.status).toBe(201);
  return payload.data.product.id;
};

const addToCart = async (baseUrl, token, productId, quantity = 1) => {
  const res = await fetch(`${baseUrl}/api/cart`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ productId, quantity }),
  });
  return { res, payload: await res.json() };
};

const createOrder = async (baseUrl, token, cartItemIds) => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ cartItemIds, shippingAddress: "Seoul" }),
  });
  return { res, payload: await res.json() };
};

describe("Policy integration tests", () => {
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

  test("본인이 등록한 상품은 장바구니에 담을 수 없다", async () => {
    const seller = await register(baseUrl, "own-cart-seller");
    const productId = await createProduct(baseUrl, seller.token);

    const { res, payload } = await addToCart(baseUrl, seller.token, productId);

    expect(res.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("본인이 등록한 상품은 구매할 수 없습니다.");
  });

  test("레거시 장바구니 데이터가 있어도 본인 상품 주문 생성은 차단된다", async () => {
    const seller = await register(baseUrl, "own-order-seller");
    const productId = await createProduct(baseUrl, seller.token);
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
    const cartItemId = createId();
    const currentTime = now();

    db.prepare(
      `
        INSERT INTO cart_items (id, user_id, product_id, quantity, price_at_added, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, ?)
      `,
    ).run(cartItemId, seller.user.id, productId, product.current_price, currentTime, currentTime);

    const { res, payload } = await createOrder(baseUrl, seller.token, [cartItemId]);

    expect(res.status).toBe(400);
    expect(payload.message).toBe("본인이 등록한 상품은 구매할 수 없습니다.");
  });

  test("레거시 주문 데이터가 있어도 본인 상품 결제는 차단된다", async () => {
    const seller = await register(baseUrl, "own-pay-seller");
    const productId = await createProduct(baseUrl, seller.token);
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
    const orderId = createId();
    const currentTime = now();

    db.prepare(
      `
        INSERT INTO orders (
          id, user_id, status, total_amount, discount_amount, shipping_fee, final_amount,
          shipping_address, created_at, updated_at, cancelled_at
        ) VALUES (?, ?, 'PENDING', ?, 0, 0, ?, 'Seoul', ?, ?, NULL)
      `,
    ).run(orderId, seller.user.id, product.current_price, product.current_price, currentTime, currentTime);

    db.prepare(
      `
        INSERT INTO order_items (
          id, order_id, product_id, seller_id, name_snapshot, image_url_snapshot, quantity, price
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `,
    ).run(createId(), orderId, productId, product.seller_id, product.name, product.image_url, product.current_price);

    const res = await fetch(`${baseUrl}/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: jsonHeaders(seller.token),
    });
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.message).toBe("본인이 등록한 상품은 결제할 수 없습니다.");
  });

  test("결제 잔액 부족 실패 시 차감 전 롤백으로 구매자 잔액이 증가하지 않는다", async () => {
    const seller = await register(baseUrl, "rollback-seller");
    const buyer = await register(baseUrl, "rollback-buyer");
    const productId = await createProduct(baseUrl, seller.token, { originalPrice: 4000 });

    await fetch(`${baseUrl}/api/payments/profile`, {
      method: "POST",
      headers: jsonHeaders(seller.token),
    });
    await fetch(`${baseUrl}/api/payments/profile`, {
      method: "POST",
      headers: jsonHeaders(buyer.token),
    });

    db.prepare("UPDATE payment_profiles SET balance = 0 WHERE user_id = ?").run(buyer.user.id);

    const cart = await addToCart(baseUrl, buyer.token, productId, 1);
    expect(cart.res.status).toBe(201);

    const order = await createOrder(baseUrl, buyer.token, [cart.payload.data.cartItem.id]);
    expect(order.res.status).toBe(201);

    const payRes = await fetch(`${baseUrl}/api/orders/${order.payload.data.order.id}/pay`, {
      method: "POST",
      headers: jsonHeaders(buyer.token),
    });
    const payPayload = await payRes.json();
    const buyerProfile = db.prepare("SELECT balance FROM payment_profiles WHERE user_id = ?").get(buyer.user.id);

    expect(payRes.status).toBe(200);
    expect(payPayload.data.order.paymentStatus).toBe("FAILED");
    expect(payPayload.data.payments[0].status).toBe("FAILED");
    expect(buyerProfile.balance).toBe(0);
  });

  test("판매자는 본인 상품이 포함된 주문 목록을 조회할 수 있다", async () => {
    const seller = await register(baseUrl, "seller-orders-seller");
    const buyer = await register(baseUrl, "seller-orders-buyer");
    const productId = await createProduct(baseUrl, seller.token);

    const cart = await addToCart(baseUrl, buyer.token, productId, 2);
    expect(cart.res.status).toBe(201);

    const order = await createOrder(baseUrl, buyer.token, [cart.payload.data.cartItem.id]);
    expect(order.res.status).toBe(201);

    const res = await fetch(`${baseUrl}/api/orders/seller`, {
      headers: { Authorization: `Bearer ${seller.token}` },
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.data.orders.some((entry) => entry.id === order.payload.data.order.id)).toBe(true);
    const sellerOrder = payload.data.orders.find((entry) => entry.id === order.payload.data.order.id);
    expect(sellerOrder.items).toHaveLength(1);
    expect(sellerOrder.sellerAmount).toBeGreaterThan(0);
  });

  test("여러 판매자가 포함된 주문은 주문 단위 배송 상태를 판매자 한 명이 변경할 수 없다", async () => {
    const sellerA = await register(baseUrl, "multi-status-seller-a");
    const sellerB = await register(baseUrl, "multi-status-seller-b");
    const buyer = await register(baseUrl, "multi-status-buyer");
    const productA = await createProduct(baseUrl, sellerA.token, { name: "Seller A Product" });
    const productB = await createProduct(baseUrl, sellerB.token, { name: "Seller B Product" });

    const cartA = await addToCart(baseUrl, buyer.token, productA, 1);
    const cartB = await addToCart(baseUrl, buyer.token, productB, 1);
    expect(cartA.res.status).toBe(201);
    expect(cartB.res.status).toBe(201);

    const order = await createOrder(baseUrl, buyer.token, [
      cartA.payload.data.cartItem.id,
      cartB.payload.data.cartItem.id,
    ]);
    expect(order.res.status).toBe(201);

    const payRes = await fetch(`${baseUrl}/api/orders/${order.payload.data.order.id}/pay`, {
      method: "POST",
      headers: jsonHeaders(buyer.token),
    });
    expect(payRes.status).toBe(200);

    const statusRes = await fetch(`${baseUrl}/api/orders/${order.payload.data.order.id}/status`, {
      method: "PATCH",
      headers: jsonHeaders(sellerA.token),
      body: JSON.stringify({ status: "PREPARING" }),
    });
    const statusPayload = await statusRes.json();

    expect(statusRes.status).toBe(400);
    expect(statusPayload.message).toBe("여러 판매자가 포함된 주문은 주문 단위 배송 상태를 변경할 수 없습니다.");
  });
});
