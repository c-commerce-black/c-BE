const fs = require("fs");
const path = require("path");
const app = require("./app");
const { UPLOAD_LOCAL_DIR } = require("./config");

const TINY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0ioAAAAASUVORK5CYII=";

describe("Uploads API Tests", () => {
  let server;
  let baseUrl;
  const uploadedFiles = [];

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
    expect(uploadPayload.data.imageUrl).toMatch(new RegExp(`^${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/uploads/.+`));

    const uploadedFileName = uploadPayload.data.key;
    uploadedFiles.push(uploadedFileName);

    const imageResponse = await fetch(uploadPayload.data.imageUrl);

    expect(imageResponse.status).toBe(200);
    expect(imageResponse.headers.get("content-type")).toBe("image/png");
  });
});
