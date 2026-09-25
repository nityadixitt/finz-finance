# Finz Finance — Server Backend

The backend is a Node.js + Express + TypeScript service that executes deterministic financial calculations, enforces multi-tenant data isolation, and orchestrates grounded AI reasoning via tool-calling over MySQL/SQLite.

For complete documentation, API endpoints, and configuration, see the root [README.md](../README.md).

### Scripts
* `npm run dev`: Launch the Express server with live reload (`tsx watch`).
* `npm run build`: Compile TypeScript into `dist/`.
* `npm start`: Run the compiled production server.
