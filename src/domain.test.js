const {
  calculateCurrentPrice,
  getDDay,
  buildProductState,
  decorateProductRow,
  parseDateInput,
  formatDate,
} = require("./domain");

const DAY_MS = 24 * 60 * 60 * 1000;

// UTC 오늘 자정 기준 타임스탬프
const todayUTCMs = () => {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

const daysFromNow = (n) => todayUTCMs() + n * DAY_MS;

// ─────────────────────────────────────────────
describe("calculateCurrentPrice", () => {
  test("dDay <= 0 이면 원가의 30%를 반환한다", () => {
    expect(calculateCurrentPrice(10000, 0)).toBe(3000);
    expect(calculateCurrentPrice(10000, -1)).toBe(3000);
  });

  test("dDay <= 2 이면 원가의 50%를 반환한다", () => {
    expect(calculateCurrentPrice(10000, 1)).toBe(5000);
    expect(calculateCurrentPrice(10000, 2)).toBe(5000);
  });

  test("dDay <= 4 이면 원가의 80%를 반환한다", () => {
    expect(calculateCurrentPrice(10000, 3)).toBe(8000);
    expect(calculateCurrentPrice(10000, 4)).toBe(8000);
  });

  test("dDay > 4 이면 원가의 95%를 반환한다", () => {
    expect(calculateCurrentPrice(10000, 5)).toBe(9500);
    expect(calculateCurrentPrice(10000, 100)).toBe(9500);
  });

  test("반올림 처리가 올바르게 된다", () => {
    // 3333 * 0.5 = 1666.5 => 반올림 => 1667
    expect(calculateCurrentPrice(3333, 1)).toBe(1667);
  });
});

// ─────────────────────────────────────────────
describe("getDDay", () => {
  test("오늘이면 dDay=0을 반환한다", () => {
    expect(getDDay(todayUTCMs())).toBe(0);
  });

  test("내일이면 dDay=1을 반환한다", () => {
    expect(getDDay(daysFromNow(1))).toBe(1);
  });

  test("어제이면 dDay=-1을 반환한다", () => {
    expect(getDDay(daysFromNow(-1))).toBe(-1);
  });

  test("5일 후면 dDay=5를 반환한다", () => {
    expect(getDDay(daysFromNow(5))).toBe(5);
  });
});

// ─────────────────────────────────────────────
describe("parseDateInput", () => {
  test("유효한 날짜 문자열을 타임스탬프로 파싱한다", () => {
    const result = parseDateInput("2030-01-01");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });

  test("빈 값이면 에러를 던진다", () => {
    expect(() => parseDateInput("")).toThrow("expiryDate is required");
    expect(() => parseDateInput(null)).toThrow("expiryDate is required");
  });

  test("유효하지 않은 날짜이면 에러를 던진다", () => {
    expect(() => parseDateInput("not-a-date")).toThrow("expiryDate must be a valid YYYY-MM-DD date");
  });
});

// ─────────────────────────────────────────────
describe("buildProductState", () => {
  test("정상 상품(dDay=10)의 상태를 올바르게 빌드한다", () => {
    const row = {
      original_price: 10000,
      stock: 5,
      expiry_date: daysFromNow(10),
      deleted_at: null,
    };
    const state = buildProductState(row);
    expect(state.dDay).toBe(10);
    expect(state.currentPrice).toBe(9500); // dDay > 4 => 95%
    expect(state.status).toBe("ON_SALE");
    expect(state.discountRate).toBe(5); // (10000 - 9500) / 10000 * 100 = 5%
  });

  test("dDay <= 3인 상품은 EXPIRY_SOON이다", () => {
    const row = { original_price: 10000, stock: 5, expiry_date: daysFromNow(2), deleted_at: null };
    const state = buildProductState(row);
    expect(state.status).toBe("EXPIRY_SOON");
    expect(state.currentPrice).toBe(5000); // dDay <= 2 => 50%
  });

  test("stock=0인 상품은 SOLD_OUT이다", () => {
    const row = { original_price: 10000, stock: 0, expiry_date: daysFromNow(10), deleted_at: null };
    const state = buildProductState(row);
    expect(state.status).toBe("SOLD_OUT");
  });

  test("dDay < 0인 상품은 EXPIRED이다", () => {
    const row = { original_price: 10000, stock: 5, expiry_date: daysFromNow(-1), deleted_at: null };
    const state = buildProductState(row);
    expect(state.status).toBe("EXPIRED");
    expect(state.currentPrice).toBe(3000); // dDay <= 0 => 30%
  });

  test("deleted_at이 있는 상품은 DELETED이다", () => {
    const row = { original_price: 10000, stock: 5, expiry_date: daysFromNow(10), deleted_at: Date.now() };
    const state = buildProductState(row);
    expect(state.status).toBe("DELETED");
  });

  test("originalPrice가 0이면 discountRate가 0이다", () => {
    const row = { original_price: 0, stock: 5, expiry_date: daysFromNow(10), deleted_at: null };
    const state = buildProductState(row);
    expect(state.discountRate).toBe(0);
  });

  test("할인율이 올바르게 계산된다", () => {
    // dDay=10 => currentPrice = 9500, discountRate = (10000-9500)/10000*100 = 5
    const row = { original_price: 10000, stock: 5, expiry_date: daysFromNow(10), deleted_at: null };
    const state = buildProductState(row);
    expect(state.discountRate).toBe(5);
  });
});

// ─────────────────────────────────────────────
describe("decorateProductRow", () => {
  const baseRow = {
    id: "prod-1",
    name: "테스트 상품",
    description: "설명",
    category: "FOOD",
    original_price: 10000,
    stock: 5,
    expiry_date: daysFromNow(10),
    image_url: "https://example.com/img.png",
    deleted_at: null,
    shop_name: "마트",
  };

  test("DB row를 응답 객체로 올바르게 변환한다", () => {
    const result = decorateProductRow(baseRow);
    expect(result.id).toBe("prod-1");
    expect(result.name).toBe("테스트 상품");
    expect(result.category).toBe("FOOD");
    expect(result.originalPrice).toBe(10000);
    expect(result.currentPrice).toBe(9500);
    expect(result.stock).toBe(5);
    expect(result.status).toBe("ON_SALE");
    expect(result.sellerShopName).toBe("마트");
    expect(typeof result.expiryDate).toBe("string"); // 'YYYY-MM-DD' 형태
    expect(typeof result.dDay).toBe("number");
    expect(typeof result.discountRate).toBe("number");
  });

  test("shop_name이 없으면 sellerShopName은 null이다", () => {
    const result = decorateProductRow({ ...baseRow, shop_name: undefined });
    expect(result.sellerShopName).toBeNull();
  });

  test("스네이크케이스 필드가 카멜케이스로 변환된다", () => {
    const result = decorateProductRow(baseRow);
    expect(result).not.toHaveProperty("original_price");
    expect(result).not.toHaveProperty("image_url");
    expect(result).toHaveProperty("originalPrice");
    expect(result).toHaveProperty("imageUrl");
  });

  test("expiryDate가 YYYY-MM-DD 형식으로 반환된다", () => {
    const result = decorateProductRow(baseRow);
    expect(result.expiryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
