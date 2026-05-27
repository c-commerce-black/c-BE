const crypto = require("crypto");
const {
  STABLECOIN_BASE_URL,
  STABLECOIN_DRIVER,
  STABLECOIN_OPERATOR_ID,
  STABLECOIN_PRIVATE_KEY_PEM,
  STABLECOIN_TIMEOUT_MS,
} = require("./config");

class StablecoinApiError extends Error {
  constructor(message, statusCode = 500, responseBody = null) {
    super(message);
    this.name = "StablecoinApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

const sha256Hex = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

const buildCanonicalMessage = ({ operatorId, method, pathAndQuery, timestamp, bodyBuffer }) =>
  [operatorId, method.toUpperCase(), pathAndQuery, timestamp, sha256Hex(bodyBuffer)].join("\n");

const createEd25519Signature = (message) => {
  if (!STABLECOIN_PRIVATE_KEY_PEM) {
    throw new StablecoinApiError("STABLECOIN_PRIVATE_KEY_PEM is required when STABLECOIN_DRIVER=stablecoin");
  }

  return crypto.sign(null, Buffer.from(message, "utf8"), STABLECOIN_PRIVATE_KEY_PEM).toString("hex");
};

const createSignedHeaders = ({ method, pathAndQuery, body }) => {
  const bodyBuffer = body ? Buffer.from(body, "utf8") : Buffer.alloc(0);
  const timestamp = String(Date.now());
  const canonicalMessage = buildCanonicalMessage({
    operatorId: STABLECOIN_OPERATOR_ID,
    method,
    pathAndQuery,
    timestamp,
    bodyBuffer,
  });

  return {
    "Content-Type": "application/json",
    "x-nw-operator-id": STABLECOIN_OPERATOR_ID,
    "x-nw-timestamp": timestamp,
    "x-nw-signature": createEd25519Signature(canonicalMessage),
  };
};

const fetchJson = async ({ method, pathAndQuery, bodyObject }) => {
  const body = bodyObject ? JSON.stringify(bodyObject) : "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STABLECOIN_TIMEOUT_MS);

  try {
    const response = await fetch(`${STABLECOIN_BASE_URL}${pathAndQuery}`, {
      method,
      headers: createSignedHeaders({ method, pathAndQuery, body }),
      body: body || undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = { raw: text };
      }
    }

    if (!response.ok) {
      const remoteMessage = payload?.message || payload?.error_code || `stablecoin API returned ${response.status}`;
      throw new StablecoinApiError(remoteMessage, response.status, payload);
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new StablecoinApiError("stablecoin API request timed out", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const createMockTransfer = async (requestBody) => ({
  transfer_id: `mock-transfer-${crypto.randomUUID()}`,
  reference_id: requestBody.reference_id,
  status: "CONFIRMED",
  token: requestBody.token,
  amount: requestBody.amount,
  src_wallet_id: requestBody.src_wallet_id,
  dst_wallet_id: requestBody.dst_wallet_id,
});

const createTransfer = async (requestBody) => {
  if (STABLECOIN_DRIVER === "mock") {
    return createMockTransfer(requestBody);
  }

  return fetchJson({
    method: "POST",
    pathAndQuery: "/v1/transfers",
    bodyObject: requestBody,
  });
};

module.exports = {
  StablecoinApiError,
  buildCanonicalMessage,
  createTransfer,
  sha256Hex,
};
