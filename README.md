# Finz Finance

> Technical assessment submission by **Nitya Dixit**.

🔗 **Live Application:** [https://finz-finance.vercel.app](https://finz-finance.vercel.app) *(replace with your deployed URL)*  
🔗 **API Health:** [https://finz-finance-api.onrender.com/api](https://finz-finance-api.onrender.com/api)

---

## Overview

Finz Finance is a financial review web application built for the Finz assessment. The core idea is simple: **financial arithmetic is handled deterministically by database queries, while the LLM is restricted to qualitative reasoning and tool-calling.**

Instead of letting an LLM calculate totals or guess numbers:
- SQL aggregates revenue, COGS, payroll, and OpEx directly.
- The LLM calls query tools to retrieve verified numbers and cites raw transactions (`[TXN_...]`).
- Users can click any citation pill to view the underlying transaction details in an audit drawer.

---

## Features

- **P&L & Margins:** Deterministic monthly Income Statement (Revenue, COGS, Gross Margin, Payroll, OpEx, Operating Profit).
- **Variance Analysis:** Month-over-month comparisons with vendor-level driver breakdowns.
- **AI Copilot (Tool-Calling):** Chat interface powered by Google Gemini (`gemini-3.8-flash`) or OpenAI. The model executes SQL query tools to answer questions and cite transactions.
- **Review Queue:** Flags ambiguous items (such as owner equity draws or marketplace fee deductions) for manual review. Updating a category recalculates the P&L in real time.
- **Data Scoping:** Queries are scoped by `user_id`. Logged-out users or users without uploaded CSVs cannot query another user's records.

---

## How to Test the Live App

1. **Demo Mode:** Click **"Explore Demo Workspace"** on the landing page to load a pre-seeded 3-month dataset (Jan–Mar 2026).
2. **AI Copilot:** Click **"Ask AI"** in the top navigation to test questions about revenue, margins, or cost drivers.
3. **Audit Trail:** Click any citation pill (e.g. `[TXN_20260304_022]`) in chat or review cards to inspect the transaction.
4. **Review Queue:** Check the **Review** tab, reclassify or approve a flagged item, and verify that the P&L updates.
5. **Custom Data:** Sign in and upload your own CSV file in the **Ledger** view.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Sequelize ORM (MySQL / SQLite fallback)
- **AI Layer:** Google Gemini API (`gemini-3.8-flash`) / OpenAI API (`gpt-4o-mini`) via function calling

---

## Project Structure

```text
finz-finance/
├── client/
│   ├── src/
│   │   ├── config/          # routes.ts, navigation.ts
│   │   ├── pages/           # Landing, Dashboard, Ledger, P&L, Variance, Review, Intelligence
│   │   ├── components/      # layout, modals, drawers, ai
│   │   ├── services/        # API client modules
│   │   ├── types/           # Domain interfaces
│   │   └── utils/           # Formatters
├── server/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Sequelize schemas (Transaction, ReviewItem, User)
│   │   ├── routes/          # Express route definitions
│   │   └── services/        # P&L math, variance math, AI agent tools, CSV parser
└── README.md
```

---

## Deployment Configuration

### Frontend (e.g. Vercel / Netlify)
- **Build command:** `npm run build --prefix client`
- **Output directory:** `client/dist`
- **Environment variables:**
  - `VITE_API_BASE_URL`: Deployed backend API URL (e.g. `https://finz-finance-api.onrender.com/api`)

### Backend (e.g. Render / Railway)
- **Build command:** `npm run build --prefix server`
- **Start command:** `npm start --prefix server`
- **Environment variables:**
  - `PORT`: `5000`
  - `DATABASE_URL`: `mysql://<user>:<password>@<host>:3306/<database>`
  - `GEMINI_API_KEY`: Google Gemini API key
  - `AI_MODEL`: `gemini-3.8-flash`
