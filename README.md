# FinFresh Personal Finance Tracker

A robust, 3-tier personal finance application built for the FinFresh Engineering Challenge. This project focuses on **behavioral finance** by providing users with a clear "Financial Health Score" alongside standard transaction tracking.

---

## 🏗️ Architecture & Design Decisions

### Why this Tech Stack?

- **Backend (Hybrid Node.js + Python):** The core API is built with Node.js/Express for rapid development. However, for complex financial analytics (specifically the **Health Score algorithm**), the system delegates work to a specialized **Python** script. This demonstrates a polyglot approach—using the best language for the job (Python's statistical prowess vs Node's I/O).
- **Frontend (React + Vite):** React's component-driven architecture is ideal for building dynamic dashboards. **Developer Proficiency:** I am highly productive with the React.js. It is my primary frontend framework, allowing me to focus on feature delivery and complex logic rather than learning new paradigms during the challenge.
- **Database (MongoDB + Mongoose):** Personal finance data (transactions) can have varying metadata (notes, categories). A document-oriented DB allows for a flexible schema without expensive migrations. Mongoose provides a powerful abstraction for validation and indexing.

### Why these Architectural Choices?

- **Stateless Authentication:** Used JWT (JSON Web Tokens) to keep the backend stateless, allowing for easier horizontal scaling in the future.
- **RESTful API Structure:** Followed a standard Controller/Service/Route pattern. This separates the HTTP logic from the business logic, making the code more testable and maintainable.
- **CORS Strategy:** Initially used `PATCH` for updates, but switched to `PUT` after identifying persistent preflight restriction issues in some environments. Manual CORS middleware was implemented to ensure 100% reliability for cross-origin requests.

---

## 🔐 Security Implementation

- **Password Safety:** Passwords are never stored in plain text. We use `bcryptjs` with **12 salt rounds**, striking a balance between security and performance.
- **JWT Strategy:**
  - Tokens expire in **24 hours** to limit the window of risk if a token is intercepted.
  - Verification is handled by a custom `authMiddleware` that checks the standard `Authorization: Bearer` header.
- **Data Protection:**
  - Using the `toJSON` override in Mongoose models to ensure sensitive fields (like `passwordHash`) are never leaked to the client.
  - Implemented `helmet` for essential security headers (XSS protection, Clickjacking prevention).

---

## 📈 Financial Health Score Algorithm

The score (0–100) is a weighted calculation reflecting a user's monthly money habits.

| Component         | Weight | Rationale                                                                                                         |
| :---------------- | :----- | :---------------------------------------------------------------------------------------------------------------- |
| **Savings Rate**  | 40%    | The strongest indicator of wealth creation. Focuses on the "gap" between income and spend.                        |
| **Expense Ratio** | 30%    | Penalizes over-spending relative to income. Key for lifestyle inflation tracking.                                 |
| **Consistency**   | 20%    | Tracks daily variance in spending. Lower variance (lower std-dev) suggests more controlled, habit-based spending. |
| **Diversity**     | 10%    | Encourages tracking broad spend types. Using 5+ categories gives full marks.                                      |

### Robustness & Edge Cases

- **Zero Income:** Guarded against division-by-zero. If income is zero, savings rate and expense ratio default to zero to prevent crashes.
- **Low Data:** If a user has only 1 day of data, consistency is assumed at 100% (no variance yet).
- **Numeric Safety:** All frontend displays use `parseFloat` and default values (`|| 0`) to ensure that missing API fields never crash the UI.

---

## Project Structure

```
chennai-assignment/
├── api/           ← Hybrid Backend
│   ├── src/
│   │   ├── scripts/      ← Python Analytics (health_score.py)
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

## 🚀 How to Run Locally

### 1. Prerequisites

- Node.js v18+
- Python 3.10+ (for Financial Analytics)
- MongoDB (Local or Atlas)

### 2. Backend Setup

```bash
cd api
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
# API runs on http://localhost:5000
```

### 3. Frontend Setup

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
