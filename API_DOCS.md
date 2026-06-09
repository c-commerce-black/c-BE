# C-Commerce API 명세서

> Base URL: `http://localhost:3000`
> 기본 Content-Type: `application/json`
> 인증 방식: `Authorization: Bearer {accessToken}`
> Swagger UI: `GET /api-docs`

이 문서는 현재 백엔드 코드 기준으로 작성되었습니다.

---

## 1. 공통

### 공통 성공 응답

```json
{
  "success": true,
  "data": {}
}
```

### 공통 에러 응답

```json
{
  "success": false,
  "message": "에러 메시지"
}
```

### 인증 헤더

인증 필요 API는 아래 헤더가 필요합니다.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 상태 확인

`GET /health`

응답 `200`

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

---

## 2. 주요 객체

### User

```json
{
  "id": "usr_...",
  "email": "user@example.com",
  "nickname": "홍길동",
  "sellerProfileId": "sp_...",
  "shopName": "홍길동 Shop"
}
```

### Product

```json
{
  "id": "prod_...",
  "name": "유기농 사과",
  "description": "상품 설명",
  "category": "FOOD",
  "originalPrice": 10000,
  "currentPrice": 8000,
  "discountRate": 20,
  "stock": 10,
  "expiryDate": "2026-06-20",
  "dDay": 11,
  "imageUrl": "/uploads/example.jpg",
  "status": "ON_SALE",
  "sellerShopName": "판매자 Shop"
}
```

### Order

```json
{
  "id": "ord_...",
  "status": "PENDING",
  "paymentStatus": "UNPAID",
  "totalAmount": 10000,
  "discountAmount": 2000,
  "shippingFee": 2500,
  "finalAmount": 10500,
  "shippingAddress": "서울시 ...",
  "createdAt": 1780934400000,
  "updatedAt": 1780934400000,
  "paidAt": null,
  "items": [],
  "payments": []
}
```

### PaymentProfile

```json
{
  "walletId": "wallet_userid",
  "token": "USDC-test",
  "balance": 500000,
  "updatedAt": 1780934400000
}
```

### Payment

```json
{
  "id": "pay_...",
  "orderId": "ord_...",
  "sellerId": "sp_...",
  "sellerShopName": "판매자 Shop",
  "payeeNickname": "판매자",
  "payerNickname": "구매자",
  "token": "USDC-test",
  "amount": 8000,
  "status": "COMPLETED",
  "referenceId": "ord_xxxxxxxxx",
  "transferId": "tr_...",
  "errorMessage": null,
  "direction": "OUT",
  "counterparty": "판매자 Shop",
  "paidAt": 1780934400000,
  "updatedAt": 1780934400000
}
```

---

## 3. 상수

### 상품 카테고리

`FOOD`, `BEAUTY`, `DRINK`, `MEAL_KIT`, `OTHER`

### 상품 상태

`ON_SALE`, `EXPIRY_SOON`, `SOLD_OUT`, `EXPIRED`, `DELETED`

목록 조회에서는 `DELETED`, `EXPIRED` 상품이 제외됩니다.

### 주문 상태

`PENDING`, `PREPARING`, `SHIPPING`, `DELIVERED`, `CANCELLED`

### 주문 결제 상태

`UNPAID`, `FAILED`, `PARTIAL`, `PAID`

### 결제 레코드 상태

`PENDING`, `FAILED`, `COMPLETED`

### 할인 규칙

서버는 유통기한 D-Day 기준으로 현재 가격을 계산합니다.

| 조건 | 현재 가격 |
| --- | --- |
| `dDay <= 0` | 원가의 30% |
| `dDay <= 2` | 원가의 50% |
| `dDay <= 4` | 원가의 80% |
| 그 외 | 원가의 95% |

배송비는 장바구니/주문 항목이 있으면 `2500`원입니다.

---

## 4. 인증 API

Base Path: `/api/auth`

### 회원가입

`POST /api/auth/register`

인증 불필요

요청 Body

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| email | string | Y | 이메일 |
| nickname | string | Y | 닉네임, 2~20자 |
| password | string | Y | 비밀번호, 8자 이상 |
| shopName | string | N | 상점명. 없으면 `{nickname} Shop` |
| agreements.terms | boolean | N | 전달한 경우 필수 true |
| agreements.privacy | boolean | N | 전달한 경우 필수 true |
| agreements.marketing | boolean | N | 마케팅 동의 |

```json
{
  "email": "buyer@example.com",
  "nickname": "구매자",
  "password": "password123",
  "shopName": "구매자 Shop",
  "agreements": {
    "terms": true,
    "privacy": true,
    "marketing": false
  }
}
```

응답 `201`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_...",
      "email": "buyer@example.com",
      "nickname": "구매자",
      "sellerProfileId": "sp_...",
      "shopName": "구매자 Shop"
    },
    "accessToken": "jwt...",
    "expiresIn": 604800
  }
}
```

주요 에러: `400 email, nickname, and password are required`, `400 password must be at least 8 characters`, `409 Email already exists`

### 로그인

`POST /api/auth/login`

인증 불필요

```json
{
  "email": "buyer@example.com",
  "password": "password123"
}
```

응답 `200`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_...",
      "email": "buyer@example.com",
      "nickname": "구매자",
      "sellerProfileId": "sp_...",
      "shopName": "구매자 Shop"
    },
    "accessToken": "jwt...",
    "expiresIn": 604800
  }
}
```

주요 에러: `400 email and password are required`, `401 Invalid email or password`

### 로그아웃

`POST /api/auth/logout`

인증 필요

응답 `200`

```json
{
  "success": true,
  "data": {
    "message": "로그아웃 되었습니다."
  }
}
```

### 내 정보 조회

`GET /api/auth/me`

인증 필요

응답 `200`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_...",
      "email": "buyer@example.com",
      "nickname": "구매자",
      "sellerProfileId": "sp_...",
      "shopName": "구매자 Shop"
    }
  }
}
```

---

## 5. 상품 API

Base Path: `/api/products`

### 상품 목록 조회

`GET /api/products`

인증 불필요

Query

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| page | number | N | 기본값 `1` |
| limit | number | N | 기본값 `20` |
| category | string | N | 상품 카테고리 |
| status | string | N | 상품 상태 |
| q | string | N | 상품명 또는 판매자 상점명 검색 |
| sort | string | N | `expiry_asc`, `discount_desc`, `price_asc`, `price_desc` |

응답 `200`

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_...",
        "name": "유기농 사과",
        "description": "상품 설명",
        "category": "FOOD",
        "originalPrice": 10000,
        "currentPrice": 8000,
        "discountRate": 20,
        "stock": 5,
        "expiryDate": "2026-06-20",
        "dDay": 11,
        "imageUrl": "/uploads/apple.jpg",
        "status": "ON_SALE",
        "sellerShopName": "판매자 Shop"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 상품 상세 조회

`GET /api/products/{id}`

인증 불필요

응답 `200`

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_...",
      "name": "유기농 사과",
      "description": "상품 설명",
      "category": "FOOD",
      "originalPrice": 10000,
      "currentPrice": 8000,
      "discountRate": 20,
      "stock": 5,
      "expiryDate": "2026-06-20",
      "dDay": 11,
      "imageUrl": "/uploads/apple.jpg",
      "status": "ON_SALE",
      "sellerShopName": "판매자 Shop",
      "seller": {
        "id": "sp_...",
        "shopName": "판매자 Shop"
      },
      "priceHistory": [
        {
          "dDay": 4,
          "price": 8000
        }
      ]
    }
  }
}
```

주요 에러: `404 상품을 찾을 수 없습니다.`

---

## 6. 판매자 상품 관리 API

Base Path: `/api/seller/products`

모든 API 인증 필요입니다. 별도 판매자 가입 절차는 없으며, 사용자별 `sellerProfile`이 자동 생성됩니다.

### 내 판매 상품 목록/대시보드 조회

`GET /api/seller/products`

Query

| 이름 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| page | number | N | 기본값 `1` |
| limit | number | N | 기본값 `20` |

응답 `200`

```json
{
  "success": true,
  "data": {
    "todaySales": 16000,
    "stats": {
      "onSale": 3,
      "expirySoon": 1,
      "todayOrders": 2
    },
    "products": [
      {
        "id": "prod_...",
        "name": "유기농 사과",
        "currentPrice": 8000,
        "stock": 5,
        "expiryDate": "2026-06-20",
        "status": "ON_SALE",
        "todaySoldCount": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 상품 등록

`POST /api/seller/products`

요청 Body

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| name | string | Y | 상품명 |
| description | string | N | 설명 |
| category | string | Y | 상품 카테고리 |
| originalPrice | number | Y | 원가, 0 이상 |
| stock | number | Y | 재고, 0 이상 |
| expiryDate | string | Y | 유통기한. `YYYY-MM-DD` 권장 |
| imageUrl | string | N | 이미지 URL |

```json
{
  "name": "유기농 사과",
  "description": "오늘 입고된 상품",
  "category": "FOOD",
  "originalPrice": 10000,
  "stock": 10,
  "expiryDate": "2026-06-20",
  "imageUrl": "/uploads/apple.jpg"
}
```

응답 `201`

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_...",
      "name": "유기농 사과",
      "category": "FOOD",
      "originalPrice": 10000,
      "currentPrice": 9500,
      "stock": 10,
      "expiryDate": "2026-06-20",
      "status": "ON_SALE"
    }
  }
}
```

주요 에러: `400 name, category, originalPrice, stock, expiryDate are required`, `400 Invalid category`

### 상품 수정

`PATCH /api/seller/products/{id}`

요청 Body는 등록 필드 중 수정할 필드만 전달합니다.

```json
{
  "name": "유기농 사과 1kg",
  "stock": 8,
  "originalPrice": 12000
}
```

응답 `200`

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_...",
      "name": "유기농 사과 1kg",
      "currentPrice": 11400,
      "stock": 8,
      "expiryDate": "2026-06-20",
      "status": "ON_SALE",
      "updatedAt": 1780934400000
    }
  }
}
```

주요 에러: `404 상품을 찾을 수 없습니다.`, `400 Invalid category`

### 상품 삭제

`DELETE /api/seller/products/{id}`

응답 `200`

```json
{
  "success": true,
  "data": {
    "message": "상품이 삭제되었습니다."
  }
}
```

---

## 7. 이미지 업로드 API

Base Path: `/api/uploads`

### 이미지 업로드

`POST /api/uploads/images`

인증 불필요

Content-Type: `multipart/form-data`

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| image | file | Y | 이미지 파일. 최대 10MB |

응답 `201`

```json
{
  "success": true,
  "data": {
    "imageUrl": "/uploads/1780934400000-a1b2c3.jpg",
    "key": "1780934400000-a1b2c3.jpg"
  }
}
```

로컬 업로드 파일은 `GET /uploads/{key}`로 접근할 수 있습니다.

주요 에러: `400 image 필드가 필요합니다.`, `400 이미지 파일만 업로드 가능합니다.`

---

## 8. 장바구니 API

Base Path: `/api/cart`

모든 API 인증 필요입니다.

### 장바구니 조회

`GET /api/cart`

응답 `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cartItemId": "cart_...",
        "quantity": 2,
        "product": {
          "id": "prod_...",
          "name": "유기농 사과",
          "currentPrice": 8000,
          "originalPrice": 10000,
          "discountRate": 20,
          "stock": 5,
          "expiryDate": "2026-06-20",
          "dDay": 11,
          "status": "ON_SALE"
        }
      }
    ],
    "summary": {
      "totalAmount": 20000,
      "discountAmount": 4000,
      "shippingFee": 2500,
      "finalAmount": 18500
    },
    "priceChanged": false
  }
}
```

### 장바구니 상품 추가

`POST /api/cart`

```json
{
  "productId": "prod_...",
  "quantity": 2
}
```

응답 `201`

```json
{
  "success": true,
  "data": {
    "cartItem": {
      "id": "cart_...",
      "productId": "prod_...",
      "quantity": 2
    }
  }
}
```

주요 에러: `404 상품을 찾을 수 없습니다.`, `400 본인이 등록한 상품은 구매할 수 없습니다.`, `400 장바구니에 담을 수 없는 상품입니다.`, `400 재고가 부족합니다.`

### 장바구니 수량 변경

`PATCH /api/cart/{cartItemId}`

```json
{
  "quantity": 3
}
```

응답 `200`

```json
{
  "success": true,
  "data": {
    "cartItem": {
      "id": "cart_...",
      "quantity": 3,
      "updatedAt": 1780934400000
    }
  }
}
```

### 장바구니 항목 삭제

`DELETE /api/cart/{cartItemId}`

응답 `200`

```json
{
  "success": true,
  "data": {
    "message": "장바구니에서 삭제되었습니다."
  }
}
```

### 장바구니 전체 비우기

`DELETE /api/cart`

응답 `200`

```json
{
  "success": true,
  "data": {
    "message": "장바구니가 비워졌습니다."
  }
}
```

---

## 9. 주문 API

Base Path: `/api/orders`

모든 API 인증 필요입니다.

### 주문 생성

`POST /api/orders`

장바구니 항목으로 주문을 생성합니다. 주문 생성 시 장바구니 항목은 삭제되고 상품 재고가 차감됩니다. 결제는 자동 실행되지 않습니다.

```json
{
  "cartItemIds": ["cart_1", "cart_2"],
  "shippingAddress": "서울시 강남구 테헤란로 123"
}
```

응답 `201`

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_...",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "totalAmount": 20000,
      "discountAmount": 4000,
      "shippingFee": 2500,
      "finalAmount": 18500,
      "shippingAddress": "서울시 강남구 테헤란로 123",
      "createdAt": 1780934400000,
      "updatedAt": 1780934400000,
      "paidAt": null,
      "items": [
        {
          "productId": "prod_...",
          "sellerId": "sp_...",
          "sellerShopName": "판매자 Shop",
          "name": "유기농 사과",
          "imageUrl": "/uploads/apple.jpg",
          "quantity": 2,
          "price": 8000,
          "dDay": 11
        }
      ],
      "payments": []
    }
  }
}
```

주요 에러: `400 cartItemIds and shippingAddress are required`, `400 선택한 장바구니 항목을 모두 찾을 수 없습니다.`, `400 본인이 등록한 상품은 구매할 수 없습니다.`, `400 재고가 부족합니다.`

### 내 주문 목록 조회

`GET /api/orders`

응답 `200`

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord_...",
        "status": "PENDING",
        "paymentStatus": "UNPAID",
        "finalAmount": 18500,
        "createdAt": 1780934400000,
        "paidAt": null,
        "items": [
          {
            "productId": "prod_...",
            "name": "유기농 사과",
            "quantity": 2,
            "price": 8000
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

### 주문 상세 조회

`GET /api/orders/{id}`

응답 `200`

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_...",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "finalAmount": 18500,
      "items": [],
      "payments": []
    }
  }
}
```

주요 에러: `404 주문을 찾을 수 없습니다.`

### 판매자 주문 목록 조회

`GET /api/orders/seller`

로그인한 사용자의 판매자 프로필 기준으로, 본인 상품이 포함된 주문 목록을 조회합니다.

응답 `200`

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "ord_...",
        "buyerNickname": "구매자",
        "status": "PENDING",
        "paymentStatus": "PAID",
        "sellerAmount": 16000,
        "shippingAddress": "서울시 강남구 테헤란로 123",
        "createdAt": 1780934400000,
        "updatedAt": 1780934400000,
        "paidAt": 1780934400000,
        "items": [
          {
            "productId": "prod_...",
            "name": "유기농 사과",
            "imageUrl": "/uploads/apple.jpg",
            "quantity": 2,
            "price": 8000
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

주요 에러: `403 판매자 등록이 필요합니다.`

### 주문 결제

`POST /api/orders/{id}/pay`

주문 금액을 판매자별로 그룹화하여 stablecoin 결제를 실행합니다. 한 주문에 여러 판매자의 상품이 있으면 판매자별 결제 레코드가 생성됩니다.

요청 Body 없음

응답 `200`

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_...",
      "status": "PENDING",
      "paymentStatus": "PAID",
      "finalAmount": 18500,
      "paidAt": 1780934400000,
      "items": [],
      "payments": [
        {
          "id": "pay_...",
          "orderId": "ord_...",
          "sellerId": "sp_...",
          "sellerShopName": "판매자 Shop",
          "payeeNickname": "판매자",
          "payerNickname": null,
          "token": "USDC-test",
          "amount": 16000,
          "status": "COMPLETED",
          "referenceId": "ord_xxxxxxxxxxxxxxxxxxxxxxxx",
          "transferId": "mock_xxx",
          "errorMessage": null,
          "direction": null,
          "counterparty": null,
          "paidAt": 1780934400000,
          "updatedAt": 1780934400000
        }
      ]
    },
    "payments": [
      {
        "id": "pay_...",
        "orderId": "ord_...",
        "sellerId": "sp_...",
        "sellerShopName": "판매자 Shop",
        "payeeNickname": "판매자",
        "payerNickname": null,
        "token": "USDC-test",
        "amount": 16000,
        "status": "COMPLETED",
        "referenceId": "ord_xxxxxxxxxxxxxxxxxxxxxxxx",
        "transferId": "mock_xxx",
        "errorMessage": null,
        "direction": null,
        "counterparty": null,
        "paidAt": 1780934400000,
        "updatedAt": 1780934400000
      }
    ]
  }
}
```

결제 금액은 상품 금액 기준으로 판매자에게 정산됩니다. 현재 배송비(`shippingFee`)는 주문의 `finalAmount`에는 포함되지만 판매자별 stablecoin 정산 그룹에는 포함되지 않습니다.

주요 에러: `404 주문을 찾을 수 없습니다.`, `400 취소된 주문은 결제할 수 없습니다.`, `400 본인이 등록한 상품은 결제할 수 없습니다.`, `400 동일한 지갑으로는 결제할 수 없습니다.`, `400 지갑 잔액이 부족합니다.`, `400 결제할 주문 항목이 없습니다.`

### 주문 취소

`PATCH /api/orders/{id}/cancel`

`PENDING`이고 결제가 완료되지 않은 주문만 취소할 수 있습니다. 취소 시 재고가 복구됩니다.

응답 `200`

```json
{
  "success": true,
  "data": {
    "message": "주문이 취소되었습니다."
  }
}
```

주요 에러: `400 결제 완료 또는 부분 결제된 주문은 아직 취소할 수 없습니다.`, `400 PENDING 상태의 주문만 취소할 수 있습니다.`

### 주문 배송 상태 변경

`PATCH /api/orders/{id}/status`

판매자가 본인 상품이 포함된 주문의 배송 상태를 변경합니다. 결제가 완료된 주문만 변경할 수 있습니다.
현재 배송 상태는 주문 단위 상태이므로 여러 판매자가 포함된 주문은 한 판매자가 전체 주문 상태를 변경할 수 없습니다.

허용 전이: `PENDING -> PREPARING -> SHIPPING -> DELIVERED`

```json
{
  "status": "PREPARING"
}
```

응답 `200`

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "ord_...",
      "status": "PREPARING",
      "paymentStatus": "PAID",
      "updatedAt": 1780934400000
    }
  }
}
```

주요 에러: `400 status must be PREPARING, SHIPPING, or DELIVERED`, `400 결제가 완료된 주문만 배송 상태를 변경할 수 있습니다.`, `400 여러 판매자가 포함된 주문은 주문 단위 배송 상태를 변경할 수 없습니다.`, `403 본인 상품 주문만 변경할 수 있습니다.`

---

## 10. 결제 API

Base Path: `/api/payments`

모든 API 인증 필요입니다.

### 내 결제 지갑 조회

`GET /api/payments/profile`

사용자의 결제 지갑을 조회합니다. 지갑이 없으면 자동 생성됩니다.

응답 `200`

```json
{
  "success": true,
  "data": {
    "paymentProfile": {
      "walletId": "wallet_abcd1234",
      "depositAddress": "F3t9...base58",
      "token": "USDC-test",
      "balance": 500000,
      "updatedAt": 1780934400000
    }
  }
}
```

### 내 결제 지갑 보장

`POST /api/payments/profile`

지갑을 생성 또는 정규화한 뒤 반환합니다. 요청 Body 없음.

응답 `200`

```json
{
  "success": true,
  "data": {
    "paymentProfile": {
      "walletId": "wallet_abcd1234",
      "depositAddress": "F3t9...base58",
      "token": "USDC-test",
      "balance": 500000,
      "updatedAt": 1780934400000
    }
  }
}
```

### 내 결제 내역 조회

`GET /api/payments/history`

구매자로 결제한 내역과 판매자로 정산받은 내역을 함께 조회합니다.

응답 `200`

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_...",
        "orderId": "ord_...",
        "sellerId": "sp_...",
        "sellerShopName": "판매자 Shop",
        "payeeNickname": "판매자",
        "payerNickname": "구매자",
        "token": "USDC-test",
        "amount": 16000,
        "status": "COMPLETED",
        "referenceId": "ord_xxxxxxxxxxxxxxxxxxxxxxxx",
        "transferId": "mock_xxx",
        "errorMessage": null,
        "direction": "OUT",
        "counterparty": "판매자 Shop",
        "paidAt": 1780934400000,
        "updatedAt": 1780934400000
      }
    ]
  }
}
```

### 결제 플로우

1. `POST /api/auth/register` 또는 `POST /api/auth/login`으로 토큰을 받습니다.
2. 필요하면 `GET /api/payments/profile`로 구매자 지갑과 잔액을 확인합니다.
3. `POST /api/cart`로 상품을 장바구니에 담습니다.
4. `POST /api/orders`로 주문을 생성합니다.
5. `POST /api/orders/{id}/pay`로 stablecoin 결제를 실행합니다.
6. `GET /api/payments/history` 또는 `GET /api/orders/{id}`로 결제 결과를 확인합니다.

### Stablecoin 연동 메모

환경 변수 `STABLECOIN_DRIVER` 기본값은 `mock`입니다. 실연동은 `stablecoin`으로 설정하고 아래 값을 준비합니다.

| 환경 변수 | 기본값 | 설명 |
| --- | --- | --- |
| STABLECOIN_DRIVER | `mock` | `mock` 또는 `stablecoin` |
| STABLECOIN_BASE_URL | `http://127.0.0.1:8090` | stablecoin API Base URL |
| STABLECOIN_OPERATOR_ID | `operator-default` | 운영자 ID |
| STABLECOIN_PRIVATE_KEY_PEM | 빈 문자열 | 요청 서명용 private key |
| STABLECOIN_TIMEOUT_MS | `5000` | 요청 타임아웃 |
| DEFAULT_PAYMENT_TOKEN | `USDC-test` | 기본 결제 토큰 |
| DEFAULT_PAYMENT_BALANCE | `500000` | 신규 지갑 기본 잔액 |

---

## 11. 알림/찜 API

Base Path: `/api/alerts`

모든 API 인증 필요입니다.

### 알림 목록 조회

`GET /api/alerts`

찜한 상품 목록과 오늘 마감 특가 목록을 반환합니다.

응답 `200`

```json
{
  "success": true,
  "data": {
    "wishAlerts": [
      {
        "alertId": "alert_...",
        "isOn": true,
        "product": {
          "id": "prod_...",
          "name": "유기농 사과",
          "currentPrice": 8000,
          "remainSeconds": 86400
        }
      }
    ],
    "todayDeals": [
      {
        "alertId": null,
        "isOn": false,
        "product": {
          "id": "prod_...",
          "name": "오늘 마감 상품",
          "currentPrice": 3000,
          "remainSeconds": 3600
        }
      }
    ]
  }
}
```

### 상품 찜 추가

`POST /api/alerts`

```json
{
  "productId": "prod_..."
}
```

응답 `201`

```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "alert_...",
      "productId": "prod_...",
      "isOn": true
    }
  }
}
```

주요 에러: `404 상품을 찾을 수 없습니다.`, `409 이미 찜한 상품입니다.`

### 찜 알림 토글

`PATCH /api/alerts/{alertId}/toggle`

응답 `200`

```json
{
  "success": true,
  "data": {
    "alert": {
      "id": "alert_...",
      "isOn": false
    }
  }
}
```

### 찜 삭제

`DELETE /api/alerts/{alertId}`

응답 `200`

```json
{
  "success": true,
  "data": {
    "message": "찜이 해제되었습니다."
  }
}
```

---

## 12. 프론트 연동 예시

### 기본 요청

```js
const API_BASE_URL = "http://localhost:3000";

async function api(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "API request failed");
  }
  return body.data;
}
```

### 주문 후 결제

```js
const orderData = await api("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    cartItemIds: ["cart_1", "cart_2"],
    shippingAddress: "서울시 강남구 테헤란로 123"
  })
});

const paymentData = await api(`/api/orders/${orderData.order.id}/pay`, {
  method: "POST"
});
```
