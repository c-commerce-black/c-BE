const app = require("./app");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Sprint 4 API Tests (인증)", () => {
  let server;
  let baseUrl;

  beforeAll((done) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const buyerEmail = `sprint4-buyer-${uniqueSuffix}@example.com`;
  const password = "password123";
  let accessToken = "";

  test("1. 회원가입 (POST /api/auth/register)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: buyerEmail,
        nickname: "Sprint4Buyer",
        password,
      }),
    });

    const payload = await res.json();
    expect(res.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(payload.data.accessToken).toBeDefined();
    expect(payload.data.user.email).toBe(buyerEmail);
  });

  test("2. 로그인 (POST /api/auth/login)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: buyerEmail,
        password,
      }),
    });

    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.accessToken).toBeDefined();
    accessToken = payload.data.accessToken;
  });

  test("3. 내 정보 조회 (GET /api/auth/me)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.user.email).toBe(buyerEmail);
  });

  test("4. 로그아웃 (POST /api/auth/logout)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payload = await res.json();
    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
  });
});
