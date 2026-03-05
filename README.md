# FinFresh Personal Finance Tracker

A full-stack personal finance tracking application built for the FinFresh Engineering Challenge.

## Tech Stack

| Tier     | Choice             | Reason                                                                                |
| -------- | ------------------ | ------------------------------------------------------------------------------------- |
| Frontend | React + Vite       | Fast DX, component-based, excellent ecosystem for dashboards                          |
| Backend  | Node.js + Express  | Lightweight, fast JSON APIs, great MongoDB/Mongoose integration                       |
| Database | MongoDB + Mongoose | Flexible schema fits evolving finance data, strong aggregation pipeline for analytics |

---

## Project Structure

```
chennai-assignment/
├── api/           ← Node.js + Express backend
│   ├── src/
│   │   ├── config/       ← DB connection
│   │   ├── models/       ← Mongoose schemas (User, Transaction)
│   │   ├── middleware/   ← JWT auth middleware
│   │   ├── controllers/  ← Business logic
│   │   └── routes/       ← Route definitions
│   ├── .env.example
│   └── package.json
└── frontend/      ← React + Vite frontend
    ├── src/
    │   ├── api/          ← Axios instance + API calls
    │   ├── contexts/     ← AuthContext
    │   ├── components/   ← Reusable UI (Navbar, ProtectedRoute, etc.)
    │   └── pages/        ← Login, Register, Dashboard, Transactions
    └── package.json
```

---

## How to Run Locally

### Prerequisites

- Node.js v18+
- MongoDB running locally on port 27017 (or provide a MongoDB Atlas URI)

### 1. Clone & Setup Backend

```bash
cd api
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
# API runs on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### Environment Variables

**api/.env**

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finfresh
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
```

**frontend/.env**

```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Authentication

- Users register with name, email, and password
- Passwords are hashed using **bcryptjs** (salt rounds: 12)
- On login/register, a **JWT** is issued with a **24-hour expiry**
- The token is stored in `localStorage` on the client
- All protected API routes require `Authorization: Bearer <token>` header
- An Axios request interceptor automatically attaches the token to every request
- An Axios response interceptor handles `401` responses by clearing the token and redirecting to login

---

## Financial Health Score

The score is calculated over the **current calendar month** and returns a value from **0 to 100**.

### Components & Weights

| Component            | Weight | Formula                                                                             |
| -------------------- | ------ | ----------------------------------------------------------------------------------- |
| Savings Rate         | 40%    | `(income - expenses) / income`, capped [0, 1]. Returns 0 if income = 0              |
| Expense Ratio        | 30%    | `1 - min(expenses / income, 1)`. Returns 1 if both = 0                              |
| Spending Consistency | 20%    | `1 - (stddev / mean)` of daily expenses, capped [0, 1]. Returns 1 if ≤1 day of data |
| Category Diversity   | 10%    | `min(uniqueCategories / 5, 1)` — 5+ categories = full marks                         |

### Edge Cases Handled

- `income = 0, expenses = 0` → score reflects 0 on rate/ratio, not a crash
- Single day of transactions → consistency = 1.0 (no variance possible)
- No transactions at all → `{ score: 0, noData: true }`
- All division guarded against zero denominators

### Score Interpretation

- 🔴 0–39: Needs Attention
- 🟡 40–69: Fair
- 🟢 70–100: Healthy

---

## What I Would Do With More Time

1. **Refresh tokens** — implement sliding expiry with a refresh token stored in httpOnly cookie
2. **Real-time updates** — WebSocket or SSE for live dashboard refresh
3. **Budget targets** — let users set monthly budgets per category with alerts
4. **CSV/PDF export** — transaction history export
5. **Monthly trend charts** — income/expense trends over 6–12 months
6. **Unit & integration tests** — Jest + Supertest for API, React Testing Library for UI
7. **Docker Compose** — one-command local setup for the whole stack
8. **CI/CD pipeline** — GitHub Actions for lint + test on PR
