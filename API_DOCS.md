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
| shopName | string | ❌  | 상점명 (미입력 시 `{닉네임} Shop`으로 자동 생성)  |

> ℹ️ 별도의 역할 구분이 없습니다. 모든 사용자는 상품 판매와 구매를 자유롭게 할 수 있습니다.

```json
{
  "email": "user@example.com",
  "nickname": "홍길동",
  "password": "password123"
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
      "sellerProfileId": "sp123",
      "shopName": "홍길동 Shop"
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
      "sellerProfileId": "sp123",
      "shopName": "홍길동 Shop"
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
      "sellerProfileId": "sp123",
      "shopName": "홍길동 Shop"
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
> 🔒 **인증 필요** (모든 사용자가 판매 가능 - 당근마켓 방식)

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

> ℹ️ 별도의 역할 구분이 없습니다. 모든 사용자는 상품 판매와 구매를 자유롭게 할 수 있습니다.

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
