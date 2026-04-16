# API Contract

This contract defines frontend-facing request/response payloads for mocked RTK Query integration.

## Common Error Format

All endpoints return the same error envelope:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string | null"
  }
}
```

## 1. AUTH

### POST /api/auth/login

Request:

```json
{
  "email": "string",
  "password": "string"
}
```

Success Response:

```json
{
  "user": {
    "id": "string",
    "email": "string"
  },
  "role": "admin",
  "token": "string"
}
```

`role` can be `"admin" | "manager"`.

Error Response:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": null
  }
}
```

## 2. TABLES

### GET /api/tables

Request: no body

Success Response:

```json
[
  {
    "id": "string",
    "table_number": "string",
    "capacity": 4,
    "status": "available",
    "active_order_count": 0
  }
]
```

`status` can be `"available" | "occupied"`.

Error Response:

```json
{
  "error": {
    "code": "TABLES_FETCH_FAILED",
    "message": "Failed to load tables",
    "details": null
  }
}
```

### POST /api/tables

Request:

```json
{
  "table_number": "string",
  "capacity": 4
}
```

`table_number` is required and must be unique.

Success Response:

```json
{
  "id": "string",
  "table_number": "string",
  "capacity": 4,
  "status": "available",
  "active_order_count": 0
}
```

Error Response:

```json
{
  "error": {
    "code": "TABLE_VALIDATION_ERROR",
    "message": "table_number must be unique",
    "details": null
  }
}
```

### PATCH /api/tables/:id

Request:

```json
{
  "table_number": "string",
  "capacity": 6
}
```

Success Response:

```json
{
  "id": "string",
  "table_number": "string",
  "capacity": 6,
  "status": "occupied",
  "active_order_count": 2
}
```

Error Response:

```json
{
  "error": {
    "code": "TABLE_NOT_FOUND",
    "message": "Table not found",
    "details": null
  }
}
```

### DELETE /api/tables/:id

Request: no body

Success Response:

```json
{
  "success": true,
  "id": "string"
}
```

Error Response:

```json
{
  "error": {
    "code": "TABLE_NOT_FOUND",
    "message": "Table not found",
    "details": null
  }
}
```

## 3. MENU

### GET /api/menu

Request: no body

Success Response:

```json
[
  {
    "id": "string",
    "name": "string",
    "price": 280,
    "isAvailable": true
  }
]
```

Error Response:

```json
{
  "error": {
    "code": "MENU_FETCH_FAILED",
    "message": "Failed to fetch menu",
    "details": null
  }
}
```

## 4. ORDERS

### POST /api/orders

Request:

```json
{
  "order_type": "table",
  "table_id": "string",
  "items": [
    {
      "menu_item_id": "string",
      "quantity": 2
    }
  ]
}
```

`order_type` can be `"table" | "delivery" | "takeaway"`. `table_id` is required when `order_type` is `"table"`.

When `order_type` is `"table"`, the order is automatically added to the table's open session (or a new session is created).

Success Response:

```json
{
  "id": "string",
  "order_type": "table",
  "table_id": "string",
  "table_number": "T2",
  "session_id": "string",
  "status": "pending",
  "items": [
    {
      "id": "string",
      "menu_item_id": "string",
      "menu_item_name": "string",
      "quantity": 2,
      "unit_price": 280,
      "line_total": 560
    }
  ],
  "subtotal": 560,
  "gst": 28,
  "total": 588,
  "created_at": "2026-04-14T10:00:00.000Z"
}
```

Error Response:

```json
{
  "error": {
    "code": "ORDER_VALIDATION_ERROR",
    "message": "Add at least one menu item",
    "details": null
  }
}
```

### GET /api/orders

Request: no body

Returns only active orders (statuses: pending, confirmed, preparing, ready, served, out_for_delivery).

Success Response:

```json
[
  {
    "id": "string",
    "order_type": "table",
    "table_id": "string",
    "table_number": "T1",
    "session_id": "string",
    "status": "preparing",
    "items": [],
    "subtotal": 340,
    "gst": 17,
    "total": 357,
    "created_at": "2026-04-14T10:00:00.000Z"
  }
]
```

Error Response:

```json
{
  "error": {
    "code": "ORDERS_FETCH_FAILED",
    "message": "Failed to load active orders",
    "details": null
  }
}
```

### PATCH /api/orders/:id/status

Request:

```json
{
  "status": "delivered"
}
```

`status` can be `pending | confirmed | preparing | ready | served | out_for_delivery | delivered | cancelled`.

Success Response:

```json
{
  "id": "string",
  "status": "delivered"
}
```

Error Response:

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "details": null
  }
}
```

## 5. INVOICES

### POST /api/invoices

Supports both session-based (table) and order-based (takeaway) invoicing.

Request (session-based):

```json
{
  "session_id": "string"
}
```

Request (order-based):

```json
{
  "order_id": "string"
}
```

One of `session_id` or `order_id` must be provided.

Success Response:

```json
{
  "id": "string",
  "order_id": "string | undefined",
  "session_id": "string | undefined",
  "order_type": "table",
  "table_number": "T5",
  "items": [
    {
      "id": "string",
      "menu_item_id": "string",
      "menu_item_name": "string",
      "quantity": 1,
      "unit_price": 280,
      "line_total": 280
    }
  ],
  "subtotal": 280,
  "gst": 14,
  "total": 294,
  "created_at": "2026-04-14T10:00:00.000Z"
}
```

Error Response:

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "details": null
  }
}
```

### GET /api/invoices/:id

Request: no body

Success Response:

```json
{
  "id": "string",
  "order_id": "string | undefined",
  "session_id": "string | undefined",
  "order_type": "table",
  "table_number": "T5",
  "items": [],
  "subtotal": 280,
  "gst": 14,
  "total": 294,
  "created_at": "2026-04-14T10:00:00.000Z"
}
```

Error Response:

```json
{
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "Invoice not found",
    "details": null
  }
}
```

## 6. TABLE SESSIONS

A session represents a table's lifecycle from first order to bill settlement.

### GET /api/sessions

Returns all open sessions with their associated orders.

Request: no body

Success Response:

```json
[
  {
    "id": "string",
    "table_id": "string",
    "table_number": "T1",
    "status": "open",
    "order_ids": ["ord-101", "ord-102"],
    "subtotal": 630,
    "gst": 31.5,
    "total": 661.5,
    "created_at": "2026-04-14T09:15:00.000Z",
    "orders": [
      {
        "id": "ord-101",
        "order_type": "table",
        "status": "served",
        "items": [],
        "subtotal": 390,
        "gst": 19.5,
        "total": 409.5,
        "created_at": "2026-04-14T09:15:00.000Z"
      }
    ]
  }
]
```

Error Response:

```json
{
  "error": {
    "code": "SESSIONS_FETCH_FAILED",
    "message": "Failed to load sessions",
    "details": null
  }
}
```

### GET /api/sessions/:id

Returns a single session with its orders.

Request: no body

Success Response: Same shape as a single item from `GET /api/sessions`.

Error Response:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found",
    "details": null
  }
}
```

### POST /api/sessions/:id/close

Closes a session: marks all active orders as delivered, generates a consolidated invoice, and releases the table.

Request: no body (session ID in URL)

Alternatively, request body:

```json
{
  "session_id": "string"
}
```

Success Response: Returns the generated `InvoiceRecord` (same shape as `POST /api/invoices` response).

Error Response:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found",
    "details": null
  }
}
```

## 7. TAKEAWAY

### POST /api/takeaway/orders

Creates a takeaway order and immediately generates an invoice.

Request:

```json
{
  "items": [
    {
      "menu_item_id": "string",
      "quantity": 2
    }
  ]
}
```

Success Response:

```json
{
  "order": {
    "id": "string",
    "order_type": "takeaway",
    "status": "delivered",
    "items": [
      {
        "id": "string",
        "menu_item_id": "string",
        "menu_item_name": "string",
        "quantity": 2,
        "unit_price": 280,
        "line_total": 560
      }
    ],
    "subtotal": 560,
    "gst": 28,
    "total": 588,
    "created_at": "2026-04-14T10:00:00.000Z"
  },
  "invoice": {
    "id": "string",
    "order_id": "string",
    "order_type": "takeaway",
    "items": [],
    "subtotal": 560,
    "gst": 28,
    "total": 588,
    "created_at": "2026-04-14T10:00:00.000Z"
  }
}
```

Error Response:

```json
{
  "error": {
    "code": "ORDER_VALIDATION_ERROR",
    "message": "Add at least one menu item",
    "details": null
  }
}
```

## 8. INSIGHTS

### GET /api/insights

Returns aggregated analytics for a given period.

Query Params:
- `period=week|month` (required)

Success Response:

```json
{
  "period": "week",
  "total_revenue": 5226.25,
  "total_orders": 11,
  "average_order_value": 475.11,
  "order_type_breakdown": {
    "table": 6,
    "takeaway": 3,
    "delivery": 2
  },
  "top_items": [
    {
      "name": "Chicken Biryani",
      "quantity": 6,
      "revenue": 2040
    },
    {
      "name": "Paneer Lababdar",
      "quantity": 3,
      "revenue": 840
    }
  ],
  "table_utilization": [
    {
      "table_number": "T5",
      "session_count": 2,
      "total_revenue": 1385.50
    }
  ],
  "daily_revenue": [
    {
      "date": "2026-04-08",
      "revenue": 1260,
      "order_count": 1
    },
    {
      "date": "2026-04-09",
      "revenue": 409.5,
      "order_count": 1
    }
  ]
}
```

Error Response:

```json
{
  "error": {
    "code": "INSIGHTS_FETCH_FAILED",
    "message": "Failed to load insights",
    "details": null
  }
}
```

## Supplemental UI Endpoint

### GET /api/orders/history

Used by order history UI filters.

Query Params:
- `date=YYYY-MM-DD` (optional)
- `table_id=string` (optional)
- `order_type=table|delivery|takeaway` (optional)

Success Response:

```json
[
  {
    "id": "string",
    "order_type": "table",
    "table_id": "string",
    "table_number": "T5",
    "session_id": "string",
    "status": "delivered",
    "items": [],
    "subtotal": 280,
    "gst": 14,
    "total": 294,
    "created_at": "2026-04-13T10:00:00.000Z"
  }
]
```
