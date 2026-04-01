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

---

## 📋 목차

1. [공통 응답 형식](#공통-응답-형식)
2. [인증 (Auth)](#인증-auth)
3. [상품 (Products)](#상품-products)
4. [판매자 상품 관리 (Seller Products)](#판매자-상품-관리-seller-products)
5. [장바구니 (Cart)](#장바구니-cart)
6. [주문 (Orders)](#주문-orders)
7. [알림/찜 (Alerts)](#알림찜-alerts)
8. [공통 상수](#공통-상수)

---

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "message": "에러 메시지",
    "statusCode": 400
  }
}
```

### 헬스 체크
```
GET /health
```
**응답**
```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

---

## 인증 (Auth)

> **Base Path**: `/api/auth`

### POST /api/auth/register — 회원가입

**Request Body**

| 필드       | 타입     | 필수 | 설명                                 |
|----------|--------|----|------------------------------------|
| email    | string | ✅  | 이메일 주소                            |
| nickname | string | ✅  | 닉네임 (2~20자)                        |
| password | string | ✅  | 비밀번호 (최소 8자)                      |
| role     | string | ❌  | `BUYER` (기본값) 또는 `SELLER`          |
| shopName | string | ❌  | 상점명 (role이 SELLER일 때, 미입력 시 자동 생성) |

```json
{
  "email": "user@example.com",
  "nickname": "홍길동",
  "password": "password123",
  "role": "BUYER"
}
```

**응답** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123",
      "email": "user@example.com",
      "nickname": "홍길동",
      "role": "BUYER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지                                         |
|-------|---------------------------------------------|
| 400   | email, nickname, and password are required  |
| 400   | nickname must be between 2 and 20 characters |
| 400   | password must be at least 8 characters      |
| 409   | Email already exists                        |

---

### POST /api/auth/login — 로그인

**Request Body**

| 필드       | 타입     | 필수 | 설명    |
|----------|--------|-----|-------|
| email    | string | ✅  | 이메일  |
| password | string | ✅  | 비밀번호 |

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123",
      "email": "user@example.com",
      "nickname": "홍길동",
      "role": "BUYER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지                         |
|-------|-------------------------------|
| 400   | email and password are required |
| 401   | Invalid email or password     |

---

### POST /api/auth/logout — 로그아웃

> 🔒 **인증 필요**

**Headers**
```
Authorization: Bearer {accessToken}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": { "message": "로그아웃 되었습니다." }
}
```

---

### GET /api/auth/me — 내 정보 조회

> 🔒 **인증 필요**

**Headers**
```
Authorization: Bearer {accessToken}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123",
      "email": "user@example.com",
      "nickname": "홍길동",
      "role": "BUYER"
    }
  }
}
```

---

## 상품 (Products)

> **Base Path**: `/api/products`  
> 인증 불필요 (공개 API)

### GET /api/products — 상품 목록 조회

**Query Parameters**

| 파라미터   | 타입     | 설명                                                       |
|--------|--------|----------------------------------------------------------|
| page   | number | 페이지 번호 (기본값: 1)                                          |
| limit  | number | 페이지당 항목 수 (기본값: 20)                                      |
| category | string | 카테고리 필터 (`FOOD`, `BEAUTY`, `DRINK`, `MEAL_KIT`, `OTHER`) |
| status | string | 상태 필터 (`ON_SALE`, `EXPIRY_SOON`, `SOLD_OUT`)             |
| sort   | string | 정렬 기준 (아래 참조)                                            |

**sort 옵션**

| 값             | 설명          |
|---------------|-------------|
| `expiry_asc`  | 유통기한 임박순 (기본값) |
| `discount_desc` | 할인율 높은순   |
| `price_asc`   | 가격 낮은순      |
| `price_desc`  | 가격 높은순      |

> ⚠️ `DELETED`, `EXPIRED` 상태 상품은 목록에 포함되지 않습니다.

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod123",
        "name": "유기농 사과",
        "category": "FOOD",
        "originalPrice": 10000,
        "currentPrice": 7000,
        "discountRate": 30,
        "stock": 50,
        "expiryDate": "2025-12-31",
        "status": "ON_SALE",
        "dDay": 5,
        "imageUrl": "https://example.com/image.jpg"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### GET /api/products/:id — 상품 상세 조회

**Path Parameters**

| 파라미터 | 타입     | 설명    |
|------|--------|-------|
| id   | string | 상품 ID |

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod123",
      "name": "유기농 사과",
      "category": "FOOD",
      "description": "국내산 유기농 사과입니다.",
      "originalPrice": 10000,
      "currentPrice": 7000,
      "discountRate": 30,
      "stock": 50,
      "expiryDate": "2025-12-31",
      "status": "ON_SALE",
      "dDay": 5,
      "imageUrl": "https://example.com/image.jpg",
      "seller": {
        "id": "seller123",
        "shopName": "홍길동 Shop"
      },
      "priceHistory": [
        { "dDay": 5, "price": 7000 },
        { "dDay": 3, "price": 6000 }
      ]
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지              |
|-------|------------------|
| 404   | 상품을 찾을 수 없습니다.   |

---

## 판매자 상품 관리 (Seller Products)

> **Base Path**: `/api/seller/products`  
> 🔒 **인증 필요** + **SELLER 또는 ADMIN 역할 필요**

---

### GET /api/seller/products — 내 상품 목록 (판매자 대시보드)

**Headers**
```
Authorization: Bearer {accessToken}
```

**Query Parameters**

| 파라미터  | 타입     | 설명              |
|-------|--------|-----------------|
| page  | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수       |

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "todaySales": 150000,
    "stats": {
      "onSale": 10,
      "expirySoon": 3,
      "todayOrders": 5
    },
    "products": [
      {
        "id": "prod123",
        "name": "유기농 사과",
        "currentPrice": 7000,
        "stock": 50,
        "expiryDate": "2025-12-31",
        "status": "ON_SALE",
        "todaySoldCount": 12
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

### POST /api/seller/products — 상품 등록

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request Body**

| 필드            | 타입     | 필수 | 설명                              |
|-------------|--------|----|---------------------------------|
| name        | string | ✅  | 상품명                             |
| category    | string | ✅  | 카테고리 (공통 상수 참조)                 |
| originalPrice | number | ✅  | 원가 (0 이상 정수)                   |
| stock       | number | ✅  | 재고 수량 (0 이상 정수)                 |
| expiryDate  | string | ✅  | 유통기한 (예: `"2025-12-31"`)        |
| description | string | ❌  | 상품 설명                           |
| imageUrl    | string | ❌  | 이미지 URL                         |

```json
{
  "name": "유기농 사과",
  "category": "FOOD",
  "originalPrice": 10000,
  "stock": 100,
  "expiryDate": "2025-12-31",
  "description": "국내산 유기농 사과",
  "imageUrl": "https://example.com/apple.jpg"
}
```

**응답** `201 Created`
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod123",
      "name": "유기농 사과",
      "category": "FOOD",
      "originalPrice": 10000,
      "currentPrice": 10000,
      "stock": 100,
      "expiryDate": "2025-12-31",
      "status": "ON_SALE"
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지                                              |
|-------|--------------------------------------------------|
| 400   | name, category, originalPrice, stock, expiryDate are required |
| 400   | Invalid category                                 |
| 403   | 판매자 등록이 필요합니다.                                   |

---

### PATCH /api/seller/products/:id — 상품 수정

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터 | 타입     | 설명    |
|------|--------|-------|
| id   | string | 상품 ID |

**Request Body** (모두 선택 사항)

| 필드            | 타입     | 설명          |
|-------------|--------|-------------|
| name        | string | 상품명         |
| description | string | 상품 설명       |
| category    | string | 카테고리        |
| originalPrice | number | 원가          |
| stock       | number | 재고          |
| expiryDate  | string | 유통기한        |
| imageUrl    | string | 이미지 URL     |

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod123",
      "name": "유기농 사과 (수정됨)",
      "currentPrice": 8000,
      "stock": 80,
      "expiryDate": "2025-12-31",
      "status": "ON_SALE",
      "updatedAt": 1700000000000
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지            |
|-------|----------------|
| 404   | 상품을 찾을 수 없습니다. |
| 403   | 판매자 등록이 필요합니다. |

---

### DELETE /api/seller/products/:id — 상품 삭제

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터 | 타입     | 설명    |
|------|--------|-------|
| id   | string | 상품 ID |

**응답** `200 OK`
```json
{
  "success": true,
  "data": { "message": "상품이 삭제되었습니다." }
}
```

> ℹ️ 실제 DB 삭제가 아닌 소프트 삭제(`DELETED` 상태 전환)

**에러 케이스**

| 상태 코드 | 메시지            |
|-------|----------------|
| 404   | 상품을 찾을 수 없습니다. |

---

## 장바구니 (Cart)

> **Base Path**: `/api/cart`  
> 🔒 **모든 엔드포인트 인증 필요**

### GET /api/cart — 장바구니 조회

**Headers**
```
Authorization: Bearer {accessToken}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cartItemId": "cart123",
        "quantity": 2,
        "product": {
          "id": "prod123",
          "name": "유기농 사과",
          "currentPrice": 7000,
          "originalPrice": 10000,
          "status": "ON_SALE",
          "imageUrl": "https://example.com/apple.jpg"
        }
      }
    ],
    "summary": {
      "totalAmount": 20000,
      "discountAmount": 6000,
      "shippingFee": 2500,
      "finalAmount": 16500
    },
    "priceChanged": false
  }
}
```

> ℹ️ `priceChanged: true`이면 장바구니에 담은 후 상품 가격이 변경된 것을 의미합니다.

---

### POST /api/cart — 장바구니 담기

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request Body**

| 필드        | 타입     | 필수 | 설명          |
|---------|--------|-----|-------------|
| productId | string | ✅  | 상품 ID       |
| quantity | number | ✅  | 수량 (1 이상)   |

```json
{
  "productId": "prod123",
  "quantity": 2
}
```

**응답** `201 Created`
```json
{
  "success": true,
  "data": {
    "cartItem": {
      "id": "cart123",
      "productId": "prod123",
      "quantity": 2
    }
  }
}
```

> ℹ️ 동일 상품이 이미 장바구니에 있으면 수량이 합산됩니다.

**에러 케이스**

| 상태 코드 | 메시지               |
|-------|-------------------|
| 400   | 재고가 부족합니다.        |
| 400   | 장바구니에 담을 수 없는 상품입니다. |
| 404   | 상품을 찾을 수 없습니다.    |

---

### PATCH /api/cart/:cartItemId — 장바구니 수량 변경

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터       | 타입     | 설명         |
|----------|--------|------------|
| cartItemId | string | 장바구니 항목 ID |

**Request Body**

| 필드       | 타입     | 필수 | 설명         |
|--------|--------|-----|------------|
| quantity | number | ✅  | 새 수량 (1 이상) |

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "cartItem": {
      "id": "cart123",
      "quantity": 3,
      "updatedAt": 1700000000000
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지                |
|-------|--------------------| 
| 400   | 재고가 부족합니다.         |
| 404   | 장바구니 항목을 찾을 수 없습니다. |

---

### DELETE /api/cart/:cartItemId — 장바구니 항목 삭제

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터       | 타입     | 설명         |
|----------|--------|------------|
| cartItemId | string | 장바구니 항목 ID |

**응답** `200 OK`
```json
{
  "success": true,
  "data": { "message": "장바구니에서 삭제되었습니다." }
}
```

**에러 케이스**

| 상태 코드 | 메시지                |
|-------|--------------------| 
| 404   | 장바구니 항목을 찾을 수 없습니다. |

---

### DELETE /api/cart — 장바구니 전체 비우기

**Headers**
```
Authorization: Bearer {accessToken}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": { "message": "장바구니가 비워졌습니다." }
}
```

---

## 주문 (Orders)

> **Base Path**: `/api/orders`  
> 🔒 **모든 엔드포인트 인증 필요**

### POST /api/orders — 주문 생성

장바구니에서 선택한 항목으로 주문을 생성합니다. 주문 생성 시 해당 장바구니 항목은 자동으로 삭제되고 재고가 차감됩니다.

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request Body**

| 필드              | 타입       | 필수 | 설명                     |
|-------------|----------|-----|------------------------|
| cartItemIds | string[] | ✅  | 주문할 장바구니 항목 ID 배열       |
| shippingAddress | string | ✅  | 배송지 주소                 |

```json
{
  "cartItemIds": ["cart123", "cart456"],
  "shippingAddress": "서울시 강남구 테헤란로 123"
}
```

**응답** `201 Created`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order123",
      "status": "PENDING",
      "totalAmount": 20000,
      "discountAmount": 6000,
      "shippingFee": 2500,
      "finalAmount": 16500,
      "shippingAddress": "서울시 강남구 테헤란로 123",
      "createdAt": 1700000000000,
      "items": [
        {
          "productId": "prod123",
          "name": "유기농 사과",
          "imageUrl": "https://example.com/apple.jpg",
          "quantity": 2,
          "price": 7000,
          "dDay": 5
        }
      ]
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지                        |
|-------|----------------------------|
| 400   | cartItemIds and shippingAddress are required |
| 400   | 선택한 장바구니 항목을 모두 찾을 수 없습니다. |
| 400   | {상품명} 상품은 주문할 수 없습니다.      |
| 400   | {상품명} 재고가 부족합니다.           |

---

### GET /api/orders — 주문 목록 조회

**Headers**
```
Authorization: Bearer {accessToken}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order123",
        "status": "PENDING",
        "finalAmount": 16500,
        "createdAt": 1700000000000,
        "items": [
          {
            "productId": "prod123",
            "name": "유기농 사과",
            "quantity": 2,
            "price": 7000
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 1,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/orders/:id — 주문 상세 조회

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터 | 타입     | 설명    |
|------|--------|-------|
| id   | string | 주문 ID |

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order123",
      "status": "PENDING",
      "totalAmount": 20000,
      "discountAmount": 6000,
      "shippingFee": 2500,
      "finalAmount": 16500,
      "shippingAddress": "서울시 강남구 테헤란로 123",
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000,
      "items": [
        {
          "productId": "prod123",
          "name": "유기농 사과",
          "imageUrl": "https://example.com/apple.jpg",
          "quantity": 2,
          "price": 7000,
          "dDay": 5
        }
      ]
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지           |
|-------|---------------|
| 404   | 주문을 찾을 수 없습니다. |

---

### PATCH /api/orders/:id/cancel — 주문 취소 (구매자)

`PENDING` 상태인 주문만 취소할 수 있습니다. 취소 시 재고가 자동으로 복구됩니다.

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터 | 타입     | 설명    |
|------|--------|-------|
| id   | string | 주문 ID |

**응답** `200 OK`
```json
{
  "success": true,
  "data": { "message": "주문이 취소되었습니다." }
}
```

**에러 케이스**

| 상태 코드 | 메시지                      |
|-------|--------------------------|
| 400   | PENDING 상태의 주문만 취소할 수 있습니다. |
| 404   | 주문을 찾을 수 없습니다.            |

---

### PATCH /api/orders/:id/status — 주문 상태 변경 (판매자)

> 🔒 **SELLER 또는 ADMIN 역할 필요**  
> 본인 상품이 포함된 주문만 변경 가능합니다.

**허용된 상태 전이**

```
PENDING → PREPARING → SHIPPING → DELIVERED
```

> ⚠️ `PENDING`, `CANCELLED`로는 직접 변경 불가합니다.

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터 | 타입     | 설명    |
|------|--------|-------|
| id   | string | 주문 ID |

**Request Body**

| 필드     | 타입     | 필수 | 설명                                       |
|----|--------|-----|------------------------------------------|
| status | string | ✅  | `PREPARING`, `SHIPPING`, `DELIVERED` 중 하나 |

```json
{
  "status": "PREPARING"
}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order123",
      "status": "PREPARING",
      "updatedAt": 1700000000000
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지                              |
|-------|----------------------------------|
| 400   | status must be PREPARING, SHIPPING, or DELIVERED |
| 400   | 허용되지 않는 상태 전이입니다.               |
| 403   | 본인 상품 주문만 변경할 수 있습니다.           |
| 403   | 판매자 등록이 필요합니다.                   |
| 404   | 주문을 찾을 수 없습니다.                   |

---

## 알림/찜 (Alerts)

> **Base Path**: `/api/alerts`  
> 🔒 **모든 엔드포인트 인증 필요**

### GET /api/alerts — 알림/찜 목록 조회

오늘 마감(D-1 ~ D-0) 상품 목록과 내가 찜한 상품 목록을 함께 반환합니다.

**Headers**
```
Authorization: Bearer {accessToken}
```

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "wishAlerts": [
      {
        "alertId": "alert123",
        "isOn": true,
        "product": {
          "id": "prod123",
          "name": "유기농 사과",
          "currentPrice": 7000,
          "status": "EXPIRY_SOON",
          "remainSeconds": 86400
        }
      }
    ],
    "todayDeals": [
      {
        "alertId": null,
        "isOn": false,
        "product": {
          "id": "prod456",
          "name": "신선 딸기",
          "currentPrice": 5000,
          "status": "ON_SALE",
          "remainSeconds": 43200
        }
      }
    ]
  }
}
```

> ℹ️ `todayDeals`의 `alertId`가 `null`이면 아직 찜하지 않은 상품입니다.

---

### POST /api/alerts — 상품 찜하기

**Headers**
```
Authorization: Bearer {accessToken}
```

**Request Body**

| 필드        | 타입     | 필수 | 설명    |
|---------|--------|-----|-------|
| productId | string | ✅  | 상품 ID |

```json
{
  "productId": "prod123"
}
```

**응답** `201 Created`
```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "alert123",
      "productId": "prod123",
      "isOn": true
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지            |
|-------|----------------|
| 404   | 상품을 찾을 수 없습니다. |
| 409   | 이미 찜한 상품입니다.   |

---

### PATCH /api/alerts/:alertId/toggle — 알림 ON/OFF 토글

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터    | 타입     | 설명    |
|---------|--------|-------|
| alertId | string | 알림 ID |

**응답** `200 OK`
```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "alert123",
      "isOn": false
    }
  }
}
```

**에러 케이스**

| 상태 코드 | 메시지           |
|-------|---------------|
| 404   | 알림을 찾을 수 없습니다. |

---

### DELETE /api/alerts/:alertId — 찜 해제

**Headers**
```
Authorization: Bearer {accessToken}
```

**Path Parameters**

| 파라미터    | 타입     | 설명    |
|---------|--------|-------|
| alertId | string | 알림 ID |

**응답** `200 OK`
```json
{
  "success": true,
  "data": { "message": "찜이 해제되었습니다." }
}
```

**에러 케이스**

| 상태 코드 | 메시지           |
|-------|---------------|
| 404   | 알림을 찾을 수 없습니다. |

---

## 공통 상수

### 역할 (Roles)

| 값       | 설명  |
|---------|-----|
| `BUYER`  | 구매자 |
| `SELLER` | 판매자 |
| `ADMIN`  | 관리자 |

### 상품 카테고리 (Product Categories)

| 값          | 설명   |
|-----------|------|
| `FOOD`     | 식품   |
| `BEAUTY`   | 뷰티   |
| `DRINK`    | 음료   |
| `MEAL_KIT` | 밀키트  |
| `OTHER`    | 기타   |

### 상품 상태 (Product Statuses)

| 값             | 설명                     |
|-------------|------------------------|
| `ON_SALE`    | 판매 중 (D-Day > 3일)      |
| `EXPIRY_SOON` | 임박특가 (D-Day ≤ 3일, 재고 있음) |
| `SOLD_OUT`   | 품절 (재고 0)              |
| `EXPIRED`    | 유통기한 만료               |
| `DELETED`    | 삭제됨 (소프트 삭제)          |

### 주문 상태 (Order Statuses)

| 값           | 설명       |
|-----------|----------|
| `PENDING`   | 결제 대기    |
| `PREPARING` | 배송 준비 중  |
| `SHIPPING`  | 배송 중     |
| `DELIVERED` | 배송 완료    |
| `CANCELLED` | 취소됨      |

### 기타

| 항목       | 값      |
|--------|------|
| 배송비     | 2,500원 |
| JWT 만료  | 7일    |

---

*이 문서는 C-Commerce v1.0.0 기준으로 작성되었습니다.*

