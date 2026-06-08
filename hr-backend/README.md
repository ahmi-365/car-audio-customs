# HR Car Audio – Invoice Backend

Node.js + Express + MongoDB backend for the HR Car Audio & Tints invoice management system.

## Setup

```bash
cd hr-backend
cp .env.example .env   # then edit values
npm install
npm run seed           # creates admin user from .env
npm run dev            # starts on http://localhost:5000
```

## Endpoints

- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me` — current user (Bearer token)
- `GET  /api/invoices` — list
- `POST /api/invoices` — create
- `GET  /api/invoices/:id` — read
- `PUT  /api/invoices/:id` — update
- `DELETE /api/invoices/:id` — delete
- `GET  /api/invoices/:id/pdf` — download PDF
- `POST /api/invoices/:id/email` — `{ to?, subject?, message? }` send PDF via SMTP

All `/api/invoices/*` require `Authorization: Bearer <token>`.

## Notes
- No tax in calculations.
- Items: `{ name, description?, price, quantity }`.
- Totals: `subtotal = sum(price*qty)`, `total = subtotal`, `balanceDue = total - depositPaid`.
- PDF mirrors the layout of the original `pdfkit` template, branded for HR Car Audio.
