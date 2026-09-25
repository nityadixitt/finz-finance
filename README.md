# Finz Finance — Deterministic Financial Engine & Grounded AI Analyst

> **Authored by Nitya Dixit for the Finz Technical Assessment**

Finz Finance is an enterprise-grade financial intelligence platform that bridges deterministic financial arithmetic with a grounded, tool-calling AI Copilot. By separating arithmetic calculation (delegated strictly to relational database aggregation) from qualitative reasoning (handled by multi-turn LLMs), Finz guarantees **zero math hallucinations** while providing clickable, transaction-level audit trails for every insight.

---

## 🏛 Core Architectural Pillars

| Challenge in Standard LLM Finance | Finz Finance Architecture Solution |
| :--- | :--- |
| **Arithmetic Hallucinations**<br>LLMs cannot reliably perform deterministic financial calculations. | **Deterministic SQL Aggregation Engine**<br>Revenue, COGS, Payroll, and OpEx are aggregated via database `SUM` and `GROUP BY` queries. The AI never guesses numbers. |
| **Lack of Verifiable Audit Trails**<br>Generic answers lack transaction-level proof. | **Clickable Citation Pills (`[TXN_...]`)**<br>Every assertion references specific bank entries that link directly into an interactive transaction inspector drawer. |
| **Multi-Tenant Data Leakage**<br>Unauthenticated or cross-tenant data exposure. | **Strict Tenant Data Isolation**<br>Logged-out users and empty workspaces are quarantined with zero cross-tenant ledger queries or leakage. |
| **Lost Human Judgment**<br>Chat-only corrections don't persist into the accounting records. | **Persistent Review Queue**<br>Ambiguous transactions are queued for controller sign-off. Approving or reclassifying items instantly recalculates the live P&L. |
| **Shallow Variance Summaries**<br>Missing vendor-level root causes. | **MoM Variance & Driver Bridge**<br>Decomposes changes in operating profit into specific vendor shifts, volume changes, and percentage deltas. |

---

## ⚡ Tech Stack

### Frontend (`client/`)
* **Framework**: React 19 with TypeScript
* **Build Tooling**: Vite 8 with HMR
* **Styling**: Tailwind CSS v4 & Lucide React
* **Data Visualization**: Recharts
* **Markdown Engine**: Custom tokenized parser with interactive citation pills

### Backend (`server/`)
* **Runtime**: Node.js with TypeScript & Express
* **ORM & Database**: Sequelize ORM with MySQL support and SQLite fallback
* **AI & LLM Orchestration**: Native multi-turn tool-calling with Google Gemini (`gemini-3.8-flash`) and OpenAI (`gpt-4o-mini`)
* **CSV Parsing**: Streaming CSV ingestion engine with confidence scoring and automated anomaly flagging

---

## 📁 Repository Structure

```text
finz-finance/
├── client/                          # React + TypeScript Frontend
│   ├── src/
│   │   ├── config/                  # Centralized Route & Navigation Config
│   │   │   ├── routes.ts            # Route paths, keys, and view metadata
│   │   │   ├── navigation.ts        # Navigation bar & tab definitions
│   │   │   └── index.ts
│   │   ├── pages/                   # Full-Page View Components
│   │   │   ├── LandingPage.tsx      # Public product landing page
│   │   │   ├── DashboardPage.tsx    # Executive financial overview & runway
│   │   │   ├── IntelligencePage.tsx # Autonomous health & anomaly center
│   │   │   ├── TransactionsPage.tsx # General ledger & category editor
│   │   │   ├── PnLPage.tsx          # Monthly P&L statements & margins
│   │   │   ├── VariancePage.tsx     # MoM variance & driver breakdown
│   │   │   ├── ReviewPage.tsx       # Human-in-the-loop review queue
│   │   │   └── index.ts
│   │   ├── components/              # Layered Reusable Components
│   │   │   ├── layout/              # Navbar, Footer
│   │   │   ├── modals/              # AuthModal, UploadModal, FinancialReviewReportModal
│   │   │   ├── drawers/             # AiAnalystDrawer, TransactionDetailDrawer
│   │   │   ├── ai/                  # FinancialMarkdown, BriefingCard, DiagnosticCard
│   │   │   └── index.ts
│   │   ├── services/                # API clients & HTTP services
│   │   ├── types/                   # Domain models & TypeScript interfaces
│   │   └── utils/                   # Currency & percentage formatters
│   ├── .env.example
│   └── package.json
│
├── server/                          # Express + TypeScript Backend
│   ├── src/
│   │   ├── controllers/             # Express request handlers with isolation guards
│   │   ├── models/                  # Sequelize models (Transaction, ReviewItem, User, Category)
│   │   ├── routes/                  # API route definitions
│   │   ├── services/                # Financial calculations, AI agents, ingestion engine
│   │   └── index.ts                 # Server entry point
│   ├── .env.example
│   └── package.json
│
├── .gitignore                       # GitHub-ready ignore rules
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** or **yarn**
* **MySQL** (optional; defaults to MySQL with auto-configuration)

### 1. Installation
Clone the repository and install root, client, and server dependencies:
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### 2. Environment Configuration
Copy the provided `.env.example` templates:

**Server Configuration (`server/.env`):**
```bash
cp server/.env.example server/.env
```
Fill in your database credentials and optional LLM keys:
```env
PORT=5000
DATABASE_URL=mysql://root:password@localhost:3306/finz

# LLM Configuration (Google Gemini or OpenAI)
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-3.8-flash
```

**Client Configuration (`client/.env`):**
```bash
cp client/.env.example client/.env
```
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Running Locally
Run both client and backend concurrently from the root directory:
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000/api`

---

## 🔒 Security & Data Isolation
* **Multi-Tenant Separation**: All financial queries (`pnl`, `variance`, `transactions`, `reviews`, `ai/chat`) are strictly scoped by `user_id`.
* **Logged-Out Protection**: Unauthenticated guest requests to the AI copilot are rejected with HTTP 401 and an explicit tenant isolation notice.
* **Empty Workspace Isolation**: When an authenticated user has 0 uploaded transactions, the AI refuses to query or leak demo data.
* **Zero Credential Leaks**: `.env` and secret files are strictly ignored across root, client, and server configurations.

---

## 📄 License
Authored for the Finz Technical Assessment. All rights reserved.
