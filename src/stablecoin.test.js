const { buildCanonicalMessage, sha256Hex } = require("./stablecoin");

describe("Stablecoin signing helpers", () => {
  test("buildCanonicalMessage follows request-signing guide", () => {
    const bodyBuffer = Buffer.from('{"amount":"5000000"}', "utf8");
    const canonical = buildCanonicalMessage({
      operatorId: "operator-default",
      method: "post",
      pathAndQuery: "/v1/withdrawals",
      timestamp: "1760000000000",
      bodyBuffer,
    });

    expect(canonical).toBe(
      [
        "operator-default",
        "POST",
        "/v1/withdrawals",
        "1760000000000",
        sha256Hex(bodyBuffer),
      ].join("\n"),
    );
  });
});
