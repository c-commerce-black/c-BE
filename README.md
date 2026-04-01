# c-BE

---

### **1) 문서 개요**

- 프로젝트: 시커머스 모바일 앱
- 버전: v1.0
- 목적: 화면별 기능 정의, 팀 간 구현 기준 통일, 개발/디자인 진행상태 추적
- 상태값 규칙:
    - 구현 여부: `미구현 / 진행중 / 완료`
    - 디자인 여부: `미완료 / 완료`

---

### **2) 기능명세 테이블**

| **화면** | **세부 페이지** | **Epic** | **기능** | **부가 설명** | **구현 여부** | **디자인 여부** |
| --- | --- | --- | --- | --- | --- | --- |
| Screen 1 Home | 홈 메인 | 홈 탐색 | 상단 네비게이션 표시 | 로고 + 주요 액션 진입 | 미구현 | 완료 |
| Screen 1 Home | 홈 메인 | 프로모션 | 임박 특가 배너 노출 | 마감 임박 상품 메시지 노출 | 미구현 | 완료 |
| Screen 1 Home | 홈 메인 | 상품 탐색 | 상품 리스트 2열 노출 | 카드형 목록, 빠른 탐색 | 미구현 | 완료 |
| Screen 1 Home | 홈 메인 | 글로벌 네비게이션 | 하단 탭 이동 | Home/Category/Alert/My 탭 전환 | 미구현 | 완료 |
| Screen 2 Product Detail | 상품 상세 | 상품 정보 | 상품명/태그/이미지 표시 | 카테고리/사용자 정보 포함 | 미구현 | 완료 |
| Screen 2 Product Detail | 상품 상세 | 가격 정책 | 유통기한 타이머 표시 | D-day 기반 남은 시간 노출 | 미구현 | 완료 |
| Screen 2 Product Detail | 상품 상세 | 가격 정책 | 단계별 가격 타임라인 | 마감 임박 시 자동 할인 단계 노출 | 미구현 | 완료 |
| Screen 2 Product Detail | 상품 상세 | 구매 | 수량 증감 컨트롤 | 최소/최대 수량 정책 필요 | 미구현 | 완료 |
| Screen 2 Product Detail | 상품 상세 | 구매 | 즉시 구매 CTA | 클릭 시 결제 플로우 진입 | 미구현 | 완료 |
| Screen 3 Category Search | 카테고리 검색 | 검색 | 키워드 검색 | 상품명/브랜드 기준 검색 | 미구현 | 완료 |
| Screen 3 Category Search | 카테고리 검색 | 필터 | 카테고리 칩 필터 | 전체/식품/뷰티/음료 등 | 미구현 | 완료 |
| Screen 3 Category Search | 카테고리 검색 | 정렬 | 정렬 옵션 선택 | 마감임박순/할인율순/가격순 | 미구현 | 완료 |
| Screen 3 Category Search | 카테고리 검색 | 목록 | 검색 결과 카드 노출 | 결과 수량 + 리스트 갱신 | 미구현 | 완료 |
| Screen 4 Alert Notification | 알림 | 관심상품 알림 | 찜 상품 가격/상태 알림 | 가격 하락, 마감 임박 이벤트 | 미구현 | 완료 |
| Screen 4 Alert Notification | 알림 | 특가 알림 | 오늘 마감 특가 섹션 | 우선순위 높은 딜 노출 | 미구현 | 완료 |
| Screen 4 Alert Notification | 알림 | 알림 액션 | 알림 항목 클릭 이동 | 관련 상품/화면으로 딥링크 | 미구현 | 완료 |
| Screen 5 Seller Dashboard | 사용자 대시보드 | 판매 관리 | 오늘 매출/요약 정보 | 사용자 KPI 요약 | 미구현 | 완료 |
| Screen 5 Seller Dashboard | 사용자 대시보드 | 상품 관리 | 상품 등록 CTA | 등록 화면(Screen 6) 이동 | 미구현 | 완료 |
| Screen 5 Seller Dashboard | 사용자 대시보드 | 재고 관리 | 상품별 재고/상태 카드 | 품절 임박/재고 수량 표시 | 미구현 | 완료 |
| Screen 6 Product Registration | 상품 등록 | 등록 폼 | 기본 정보 입력 | 상품명/카테고리/가격/수량 등 | 미구현 | 완료 |
| Screen 6 Product Registration | 상품 등록 | 미디어 | 상품 이미지 업로드 | 1장 이상 필수 여부 정책 필요 | 미구현 | 완료 |
| Screen 6 Product Registration | 상품 등록 | 자동할인 | 할인 스케줄 미리보기 | D-5/D-3/D-1 단계별 가격 표시 | 미구현 | 완료 |
| Screen 6 Product Registration | 상품 등록 | 제출 | 등록하기 버튼 | 유효성 통과 시 등록 API 호출 | 미구현 | 완료 |
| Screen 7 Cart Checkout | 장바구니/결제 | 장바구니 | 장바구니 아이템 리스트 | 수량/가격 변경 반영 | 미구현 | 완료 |
| Screen 7 Cart Checkout | 장바구니/결제 | 가격 안내 | 가격 변동 경고 배너 | 임박 상품 가격 변동 사전 안내 | 미구현 | 완료 |
| Screen 7 Cart Checkout | 장바구니/결제 | 정산 | 주문 요약 계산 | 상품금액/할인/배송비/총액 계산 | 미구현 | 완료 |
| Screen 7 Cart Checkout | 장바구니/결제 | 결제 | 결제하기 CTA | 결제 성공 시 완료 화면 이동 | 미구현 | 완료 |
| Screen 8 Order Confirmation | 주문 완료 | 완료 상태 | 주문 완료 메시지 노출 | 성공 아이콘 + 확정 메시지 | 미구현 | 완료 |
| Screen 8 Order Confirmation | 주문 완료 | 주문 정보 | 주문 요약 정보 노출 | 구매 상품/최종 결제금액 | 미구현 | 완료 |
| Screen 8 Order Confirmation | 주문 완료 | 배송 추적 | 배송 상태 스텝 | 준비중/배송중/완료 상태 표시 | 미구현 | 완료 |
| Screen 8 Order Confirmation | 주문 완료 | 후속 이동 | 홈으로 돌아가기 | 홈 화면으로 라우팅 | 미구현 | 완료 |
| Screen 9 Login | 로그인 | 인증 | 이메일/비밀번호 입력 | 형식 검증 + 필수값 체크 | 미구현 | 완료 |
| Screen 9 Login | 로그인 | 인증 | 로그인 버튼 | 성공 시 메인 진입, 실패 시 에러 | 미구현 | 완료 |
| Screen 9 Login | 로그인 | 계정 복구 | 비밀번호 찾기 | 비밀번호 재설정 플로우 진입 | 미구현 | 완료 |
| Screen 9 Login | 로그인 | 소셜 로그인 | Google 로그인 | OAuth 인증 후 계정 연동 | 미구현 | 완료 |
| Screen 9 Login | 로그인 | 회원 전환 | 회원가입 링크 | 가입 화면/플로우 진입 | 미구현 | 완료 |


# C-Commerce API 문서

> **Base URL**: `http://localhost:3000`  
> **Content-Type**: `application/json`  
> **인증 방식**: Bearer Token (JWT)
