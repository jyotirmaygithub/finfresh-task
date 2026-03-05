# FinFresh API — Specification

## Base URL

`http://localhost:5000/api`

---

## MongoDB Schema

### Collection: `users`

```json
{
  "_id": "ObjectId",
  "name": "String (2–50 chars)",
  "email": "String (unique, indexed, lowercase)",
  "passwordHash": "String (bcrypt, 12 rounds)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Indexes:** `{ email: 1, unique: true }`

### Collection: `transactions`

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users, indexed)",
  "type": "'income' | 'expense'",
  "amount": "Number (>0)",
  "category": "String",
  "description": "String (max 200 chars)",
  "date": "Date",
  "createdAt": "Date"
}
```

**Indexes:**

- `{ userId: 1, date: -1 }` — efficient range query + sort
- `{ userId: 1, type: 1 }` — filter by type
- `{ userId: 1, category: 1 }` — category aggregation

---

## Endpoints

### Auth Routes — `/api/auth`

| Method | Path        | Auth | Description           |
| ------ | ----------- | ---- | --------------------- |
| POST   | `/register` | ❌   | Register new user     |
| POST   | `/login`    | ❌   | Login, returns JWT    |
| GET    | `/me`       | ✅   | Get current user info |

**POST /register**

```json
// Request
{ "name": "Jyotirmay", "email": "j@example.com", "password": "secret123" }
// Response 201
{ "success": true, "token": "jwt...", "user": { "id": "...", "name": "...", "email": "..." } }
// Error 409 — email already taken
// Error 400 — validation errors
```

**POST /login**

```json
// Request
{ "email": "j@example.com", "password": "secret123" }
// Response 200
{ "success": true, "token": "jwt...", "user": { ... } }
// Error 401 — invalid credentials
```

---

### Transaction Routes — `/api/transactions` (all protected 🔒)

| Method | Path   | Description                               |
| ------ | ------ | ----------------------------------------- |
| GET    | `/`    | List transactions (filterable, paginated) |
| POST   | `/`    | Create transaction                        |
| GET    | `/:id` | Get single transaction                    |
| PUT    | `/:id` | Update transaction                        |
| DELETE | `/:id` | Delete transaction                        |

**GET / — Query Params**
| Param | Type | Description |
|---|---|---|
| `type` | `income\|expense` | Filter by type |
| `category` | string | Filter by category |
| `startDate` | ISO8601 | Range start |
| `endDate` | ISO8601 | Range end |
| `page` | number | Page (default 1) |
| `limit` | number | Per page (default 20, max 100) |

**POST / — Body**

```json
{
  "type": "expense",
  "amount": 500,
  "category": "food",
  "description": "Lunch",
  "date": "2026-03-05"
}
```

---

### Summary Routes (protected 🔒)

| Method | Path            | Description                                         |
| ------ | --------------- | --------------------------------------------------- |
| GET    | `/summary`      | Monthly income/expense summary + category breakdown |
| GET    | `/health-score` | Financial health score (0–100)                      |

**GET /summary — Response**

```json
{
  "summary": {
    "period": { "start": "...", "end": "..." },
    "totalIncome": 50000,
    "totalExpenses": 32000,
    "netSavings": 18000,
    "transactionCount": 24,
    "categoryBreakdown": [{ "category": "food", "amount": 8000 }],
    "incomeBreakdown": [{ "category": "salary", "amount": 50000 }]
  }
}
```

**GET /health-score — Response**

```json
{
  "healthScore": {
    "score": 74,
    "label": "Healthy",
    "noData": false,
    "components": {
      "savingsRate": 80,
      "expenseRatio": 64,
      "spendingConsistency": 72,
      "categoryDiversity": 60
    },
    "period": { "start": "...", "end": "..." }
  }
}
```

---

## Financial Health Score Algorithm

Score = `(savingsRate × 0.4) + (expenseRatio × 0.3) + (consistency × 0.2) + (diversity × 0.1)` × 100

| Component            | Weight | Formula                                        |
| -------------------- | ------ | ---------------------------------------------- |
| Savings Rate         | 40%    | `(income - expenses) / income` → 0 if income=0 |
| Expense Ratio        | 30%    | `1 - min(expenses/income, 1)` → 1 if both=0    |
| Spending Consistency | 20%    | `1 - (stddev/mean)` of daily expense totals    |
| Category Diversity   | 10%    | `min(uniqueExpenseCategories / 5, 1)`          |

**Score Labels:** 🔴 0–39 Needs Attention · 🟡 40–69 Fair · 🟢 70–100 Healthy

---

## HTTP Status Codes Used

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 200  | OK                                 |
| 201  | Created                            |
| 400  | Validation error                   |
| 401  | Unauthorized / invalid credentials |
| 404  | Not found                          |
| 409  | Conflict (duplicate email)         |
| 500  | Server error                       |
