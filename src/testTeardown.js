/**
 * Jest globalTeardown — 테스트 종료 후 임시 DB 파일을 정리합니다.
 */
const fs = require("fs");

module.exports = async () => {
  const dbPath = process.env.__TEST_DB_PATH__;
  if (dbPath) {
    try {
      fs.unlinkSync(dbPath);
      // WAL 파일도 함께 정리
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    } catch {
      // 정리 실패는 무시
    }
  }
};
