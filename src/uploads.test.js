const fs = require("fs");
const path = require("path");
const app = require("./app");
const { UPLOAD_LOCAL_DIR } = require("./config");

const TINY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0ioAAAAASUVORK5CYII=";

describe("Uploads API Tests", () => {
  let server;
  let baseUrl;
  const uploadedFiles = [];
  const createUploadedImage = async () => {
    const form = new FormData();
    const imageBuffer = Buffer.from(TINY_PNG_BASE64, "base64");
    form.append("image", new Blob([imageBuffer], { type: "image/png" }), "tiny.png");

    const uploadResponse = await fetch(`${baseUrl}/api/uploads/images`, {
      method: "POST",
      body: form,
    });
    const uploadPayload = await uploadResponse.json();

    expect(uploadResponse.status).toBe(201);
    expect(uploadPayload.success).toBe(true);

    const uploadedFileName = uploadPayload.data.key;
    uploadedFiles.push(uploadedFileName);

    return {
      absoluteUrl: uploadPayload.data.imageUrl,
      relativeUrl: `/uploads/${uploadedFileName}`,
      key: uploadedFileName,
    };
  };

  beforeAll(async () => {
    server = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    for (const filename of uploadedFiles) {
      const filePath = path.join(UPLOAD_LOCAL_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  test("POST /api/uploads/images returns an absolute image URL that can be fetched immediately", async () => {
    const uploadedImage = await createUploadedImage();

    expect(uploadedImage.absoluteUrl).toMatch(new RegExp(`^${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/uploads/.+`));

    const imageResponse = await fetch(uploadedImage.absoluteUrl);

    expect(imageResponse.status).toBe(200);
    expect(imageResponse.headers.get("content-type")).toBe("image/png");
  });

  test("GET /api/products/:id rewrites stored relative upload paths to absolute image URLs", async () => {
    const uploadedImage = await createUploadedImage();
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `upload-product-${uniqueSuffix}@example.com`,
        nickname: "seller",
        password: "password123",
      }),
    });
    const registerPayload = await registerResponse.json();

    expect(registerResponse.status).toBe(201);
    expect(registerPayload.success).toBe(true);

    const createProductResponse = await fetch(`${baseUrl}/api/seller/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${registerPayload.data.accessToken}`,
      },
      body: JSON.stringify({
        name: "Legacy Image Product",
        description: "relative image path",
        category: "FOOD",
        originalPrice: 3000,
        stock: 1,
        expiryDate: "2030-01-01",
        imageUrl: uploadedImage.relativeUrl,
      }),
    });
    const createProductPayload = await createProductResponse.json();

    expect(createProductResponse.status).toBe(201);
    expect(createProductPayload.success).toBe(true);

    const productResponse = await fetch(`${baseUrl}/api/products/${createProductPayload.data.product.id}`);
    const productPayload = await productResponse.json();

    expect(productResponse.status).toBe(200);
    expect(productPayload.success).toBe(true);
    expect(productPayload.data.product.imageUrl).toBe(uploadedImage.absoluteUrl);
  });
});
