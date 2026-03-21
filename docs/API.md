# API Documentation — Koszty Budowy

## Base URL

```
http://localhost:3001/api
```

## Expenses

### GET /api/expenses

Lista wydatków z opcjonalnym filtrowaniem i sortowaniem.

**Query parameters:**
| Param | Type | Default | Opis |
|-------|------|---------|------|
| category | number | — | Filtruj po categoryId |
| from | string (YYYY-MM-DD) | — | Data od (włącznie) |
| to | string (YYYY-MM-DD) | — | Data do (włącznie) |
| search | string | — | Szukaj w name i notes (ILIKE) |
| sort | string | date | Sortuj po: date, amount, name, createdAt |
| order | string | desc | Kierunek: asc, desc |
| page | number | 1 | Numer strony |
| limit | number | 50 | Wyników na stronę (max 200) |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Notariusz",
      "amount": "5700.00",
      "date": "2025-02-25",
      "notes": null,
      "goal": null,
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Formalności",
        "icon": "🏛️",
        "color": "#6366f1"
      },
      "createdAt": "2025-02-25T10:00:00.000Z",
      "updatedAt": "2025-02-25T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 17,
    "totalPages": 1
  }
}
```

### GET /api/expenses/:id

**Response 200:** Pojedynczy obiekt expense (jak wyżej, bez pagination).

**Response 404:** `{"error": "Expense not found", "statusCode": 404}`

### POST /api/expenses

**Request body:**
```json
{
  "name": "Notariusz",
  "amount": "5700.00",
  "date": "2025-02-25",
  "categoryId": 1,
  "goal": "Akt notarialny działki",
  "notes": "U notariusza Kowalskiego"
}
```

**Walidacja (Zod):**
- `name`: string, min 1, max 200
- `amount`: string matching `/^\d+(\.\d{1,2})?$/`, > 0
- `date`: string ISO date (YYYY-MM-DD)
- `categoryId`: number, positive integer
- `goal`: string, max 500, optional
- `notes`: string, max 2000, optional

**Response 201:** Utworzony obiekt expense.

**Response 400:** `{"error": "Validation error", "statusCode": 400, "details": [...]}`

### PUT /api/expenses/:id

Jak POST, wszystkie pola opcjonalne (partial update).

**Response 200:** Zaktualizowany obiekt.

### DELETE /api/expenses/:id

**Response 200:** `{"message": "Expense deleted"}`

### GET /api/expenses/stats

Statystyki wydatków.

**Query parameters:**
| Param | Type | Default | Opis |
|-------|------|---------|------|
| from | string | — | Data od |
| to | string | — | Data do |

**Response 200:**
```json
{
  "total": "95527.05",
  "count": 17,
  "byCategory": [
    {
      "categoryId": 3,
      "categoryName": "Budowa",
      "categoryIcon": "🏗️",
      "categoryColor": "#ef4444",
      "total": "62000.00",
      "count": 3
    }
  ],
  "byMonth": [
    {
      "month": "2025-02",
      "total": "5700.00",
      "count": 1
    },
    {
      "month": "2025-05",
      "total": "13160.41",
      "count": 4
    }
  ]
}
```

## Categories

### GET /api/categories

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Formalności",
    "icon": "🏛️",
    "color": "#6366f1",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "_count": {
      "expenses": 1
    }
  }
]
```

### POST /api/categories

**Request body:**
```json
{
  "name": "Formalności",
  "icon": "🏛️",
  "color": "#6366f1"
}
```

**Walidacja (Zod):**
- `name`: string, min 1, max 100, unique
- `icon`: string, max 10, optional (emoji)
- `color`: string, regex `/^#[0-9a-fA-F]{6}$/`, optional

**Response 201:** Utworzona kategoria.

### PUT /api/categories/:id

Partial update. Response 200.

### DELETE /api/categories/:id

**Response 200:** `{"message": "Category deleted"}`

**Response 409:** `{"error": "Cannot delete category with expenses", "statusCode": 409}`

## Import/Export

### POST /api/import/xlsx

Multipart form-data z plikiem .xlsx.

**Response 200:**
```json
{
  "imported": 17,
  "skipped": 0,
  "errors": []
}
```

### GET /api/export/xlsx

Pobieranie pliku .xlsx ze wszystkimi wydatkami.

**Response 200:** Plik binary (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
