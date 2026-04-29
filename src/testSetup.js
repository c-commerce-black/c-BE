/**
 * Jest globalSetup — 테스트 전용 임시 DB 경로를 설정합니다.
 * 실제 data/app.db 와 완전히 분리하여 production 데이터를 오염시키지 않습니다.
 */
const os = require("os");
const path = require("path");
const fs = require("fs");

module.exports = async () => {
  const tmpDir = os.tmpdir();
  const dbPath = path.join(tmpDir, `c-commerce-test-${Date.now()}.db`);
  process.env.DB_PATH = dbPath;
  // 자식 프로세스(jest worker)에도 전달되도록 환경변수 기록
  process.env.__TEST_DB_PATH__ = dbPath;
};
