# FinFresh Frontend — Specification

## Tech Stack

- **React + Vite** — fast HMR, ESM-based bundler
- **React Router v6** — client-side routing
- **Axios** — HTTP client with JWT interceptors
- **Recharts** — responsive chart library for spending pie chart
- **React Hook Form** — performant form management with validation
- **React Hot Toast** — lightweight notification toasts

## Screens

### `/login` — Login Screen

- Email + password form with validation
- Generic server error message (shows API error)
- Loading state spinner on submit
- Link to register page
- Redirects to `/dashboard` on success

### `/register` — Register Screen

- Name, email, password, confirm password
- Client-side password match validation
- Server-side duplicate email error handling
- Redirects to `/dashboard` on success

### `/dashboard` — Dashboard Screen

- **Summary Cards**: Total Income, Total Expenses, Net Savings, Transaction Count
- **Financial Health Score**: Animated SVG circle gauge, colored by score range (red/yellow/green), breakdown bars for each component
- **Spending Pie Chart**: Recharts donut chart with category breakdown
- **Recent Transactions**: Last 5 transactions with type, category, description, amount

### `/transactions` — Transactions Screen

- Full transaction table with type badge, category, description, date, amount
- **Filter**: by type (all / income / expense)
- **Pagination**: page controls shown when >1 page
- **Add Transaction button**: opens modal with form
- **Edit**: click Edit to open pre-populated modal
- **Delete**: click Delete → confirm modal → deletes
- All amounts safely parsed via `parseFloat()` — undefined/null never crashes UI

## Component Structure

```
src/
├── api/
│   └── axios.js          ← Axios instance + API modules (authAPI, transactionsAPI, summaryAPI)
├── contexts/
│   └── AuthContext.jsx   ← Global auth state + login/register/logout functions
├── components/
│   ├── Navbar.jsx        ← Navigation with active link highlighting
│   └── ProtectedRoute.jsx ← Redirects to /login if not authenticated
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── Transactions.jsx
├── App.jsx               ← BrowserRouter + all routes
├── main.jsx              ← Entry point
└── index.css             ← Global dark-theme CSS
```

## State Management

- Global auth state via React Context API (`AuthContext`)
- Page-level data fetching with `useState` + `useEffect`
- Form state via `react-hook-form`
- No Redux — overkill for this scope

## Error Handling

- All API calls wrapped in try/catch
- Server error messages extracted from `err.response.data.message`
- Visual error states (red warning icon + message + retry button)
- Loading states with spinner
- Empty states with helpful CTA
- 401 responses handled globally by Axios interceptor (auto-logout)

## Environment Variables

```
VITE_API_BASE_URL=http://localhost:5000/api
```
