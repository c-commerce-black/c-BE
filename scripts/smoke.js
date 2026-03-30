const app = require("../src/app");

const run = async () => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const sellerEmail = `seller-${uniqueSuffix}@example.com`;
  const buyerEmail = `buyer-${uniqueSuffix}@example.com`;

  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error("Health check failed");
    }

    const sellerRegisterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: sellerEmail,
        nickname: "seller",
        password: "password123",
      }),
    });

    const sellerRegisterPayload = await sellerRegisterResponse.json();
    if (!sellerRegisterResponse.ok) {
      throw new Error(`Seller register failed: ${JSON.stringify(sellerRegisterPayload)}`);
    }

    const sellerToken = sellerRegisterPayload.data.accessToken;

    const productCreateResponse = await fetch(`${baseUrl}/api/seller/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: "Test Product",
        description: "Smoke test product",
        category: "FOOD",
        originalPrice: 10000,
        stock: 5,
        expiryDate: "2030-01-01",
        imageUrl: "https://example.com/product.png",
      }),
    });

    const productCreatePayload = await productCreateResponse.json();
    if (!productCreateResponse.ok) {
      throw new Error(`Product create failed: ${JSON.stringify(productCreatePayload)}`);
    }

    const productsResponse = await fetch(`${baseUrl}/api/products`);
    const productsPayload = await productsResponse.json();
    if (!productsResponse.ok || productsPayload.data.products.length < 1) {
      throw new Error(`Products list failed: ${JSON.stringify(productsPayload)}`);
    }

    const productId = productCreatePayload.data.product.id;

    const buyerRegisterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: buyerEmail,
        nickname: "buyer",
        password: "password123",
      }),
    });

    const buyerRegisterPayload = await buyerRegisterResponse.json();
    if (!buyerRegisterResponse.ok) {
      throw new Error(`Buyer register failed: ${JSON.stringify(buyerRegisterPayload)}`);
    }

    const buyerToken = buyerRegisterPayload.data.accessToken;

    const addToCartResponse = await fetch(`${baseUrl}/api/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const addToCartPayload = await addToCartResponse.json();
    if (!addToCartResponse.ok) {
      throw new Error(`Add to cart failed: ${JSON.stringify(addToCartPayload)}`);
    }

    const cartResponse = await fetch(`${baseUrl}/api/cart`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    const cartPayload = await cartResponse.json();
    if (!cartResponse.ok || cartPayload.data.items.length !== 1) {
      throw new Error(`Cart fetch failed: ${JSON.stringify(cartPayload)}`);
    }

    const cartItemId = cartPayload.data.items[0].cartItemId;

    const orderCreateResponse = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        cartItemIds: [cartItemId],
        shippingAddress: "Seoul Campus",
      }),
    });

    const orderCreatePayload = await orderCreateResponse.json();
    if (!orderCreateResponse.ok) {
      throw new Error(`Order create failed: ${JSON.stringify(orderCreatePayload)}`);
    }

    const alertsResponse = await fetch(`${baseUrl}/api/alerts`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (!alertsResponse.ok) {
      throw new Error("Alerts endpoint failed");
    }

    console.log("Smoke test passed.");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
