const { buildCanonicalMessage, createWallet, sha256Hex } = require("./stablecoin");

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

  test("mock wallet creation returns a local wallet id shape", async () => {
    await expect(createWallet({ label: "user-1" })).resolves.toMatchObject({
      wallet_id: expect.stringMatching(/^wallet_/),
      label: "user-1",
      wallet_type: "USER",
    });
  });
});
