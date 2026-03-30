const { parseInteger, parsePagination, pickFields, normalizeEmail, normalizeNickname, sanitizeUser } = require("./utils");

describe("parseInteger", () => {
  test("정상 정수값을 파싱한다", () => {
    expect(parseInteger("42", "field")).toBe(42);
    expect(parseInteger(10, "field")).toBe(10);
  });

  test("NaN이면 에러를 던진다", () => {
    expect(() => parseInteger("abc", "field")).toThrow("field must be a number");
  });

  test("min 옵션 미만이면 에러를 던진다", () => {
    expect(() => parseInteger(-1, "field", { min: 0 })).toThrow("field must be at least 0");
  });

  test("min 경계값은 통과한다", () => {
    expect(parseInteger(0, "field", { min: 0 })).toBe(0);
  });

  test("allowZero=false일 때 0이면 에러를 던진다", () => {
    expect(() => parseInteger(0, "field", { allowZero: false })).toThrow("field must be greater than 0");
  });

  test("allowZero=false일 때 양수는 통과한다", () => {
    expect(parseInteger(1, "field", { allowZero: false })).toBe(1);
  });
});

describe("parsePagination", () => {
  test("아무 쿼리도 없으면 기본값을 반환한다", () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  test("page와 limit을 파싱한다", () => {
    const result = parsePagination({ page: "3", limit: "10" });
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  test("limit은 최대 100으로 제한된다", () => {
    const result = parsePagination({ limit: "9999" });
    expect(result.limit).toBe(100);
  });

  test("limit=0은 falsy이므로 기본값 20으로 처리된다", () => {
    // parseInt("0") = 0 → 0 || 20 = 20 (실제 코드 동작)
    const result = parsePagination({ limit: "0" });
    expect(result.limit).toBe(20);
  });

  test("page는 음수이면 1로 제한된다", () => {
    const result = parsePagination({ page: "-5" });
    expect(result.page).toBe(1);
  });

  test("숫자가 아닌 page는 1로 처리된다", () => {
    const result = parsePagination({ page: "abc" });
    expect(result.page).toBe(1);
  });
});

describe("pickFields", () => {
  test("지정한 키만 선택한다", () => {
    const src = { a: 1, b: 2, c: 3 };
    expect(pickFields(src, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  test("값이 undefined인 필드는 제외한다", () => {
    const src = { a: 1, b: undefined };
    expect(pickFields(src, ["a", "b"])).toEqual({ a: 1 });
  });

  test("소스에 없는 키는 결과에 포함되지 않는다", () => {
    const src = { a: 1 };
    expect(pickFields(src, ["a", "z"])).toEqual({ a: 1 });
  });

  test("키를 지정하지 않으면 빈 객체를 반환한다", () => {
    expect(pickFields({ a: 1 }, [])).toEqual({});
  });
});

describe("normalizeEmail", () => {
  test("소문자로 변환하고 공백을 제거한다", () => {
    expect(normalizeEmail("  Hello@Example.COM  ")).toBe("hello@example.com");
  });

  test("null 또는 undefined는 빈 문자열로 처리한다", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("normalizeNickname", () => {
  test("앞뒤 공백을 제거한다", () => {
    expect(normalizeNickname("  홍길동  ")).toBe("홍길동");
  });

  test("null 또는 undefined는 빈 문자열로 처리한다", () => {
    expect(normalizeNickname(null)).toBe("");
    expect(normalizeNickname(undefined)).toBe("");
  });
});

describe("sanitizeUser", () => {
  test("null 입력 시 null을 반환한다", () => {
    expect(sanitizeUser(null)).toBeNull();
  });

  test("유효한 user 객체를 올바르게 변환한다", () => {
    const row = {
      id: "user-1",
      email: "test@example.com",
      nickname: "홍길동",
      created_at: 1700000000000,
      seller_profile_id: null,
      shop_name: null,
    };
    expect(sanitizeUser(row)).toEqual({
      id: "user-1",
      email: "test@example.com",
      nickname: "홍길동",
      createdAt: 1700000000000,
      sellerProfileId: null,
      shopName: null,
    });
  });

  test("seller 정보가 있으면 sellerProfileId와 shopName을 채운다", () => {
    const row = {
      id: "user-2",
      email: "seller@example.com",
      nickname: "셀러",
      created_at: 1700000000000,
      seller_profile_id: "sp-1",
      shop_name: "마트",
    };
    const result = sanitizeUser(row);
    expect(result.sellerProfileId).toBe("sp-1");
    expect(result.shopName).toBe("마트");
  });
});
