/**
 * Jest setupFile — 각 테스트 워커에서 테스트 전용 DB 경로를 설정합니다.
 * globalSetup의 환경변수는 worker에 전달되지 않으므로 여기서 직접 설정합니다.
 */
const os = require("os");
const path = require("path");

// 이미 설정된 경우(globalSetup에서) 유지, 없으면 새 임시 경로 설정
if (!process.env.DB_PATH || process.env.DB_PATH.includes("app.db")) {
  // 워커 ID 기반으로 유니크한 DB 경로 생성
  const workerId = process.env.JEST_WORKER_ID || "1";
  process.env.DB_PATH = path.join(os.tmpdir(), `c-commerce-test-worker-${workerId}-${Date.now()}.db`);
}
