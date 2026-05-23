---
type: reference
agent_role: architect
context_depth: 4
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
critical: true
---

# ASANMOD v1.0.0: System Architecture

> **Deterministic structural Blueprint for AI-Autonomous and Human-Led engineering.**

---

## 🏗️ 1. Technical Topology

| Layer                | Technology             | Primary Directory        |
| :------------------- | :--------------------- | :----------------------- |
| **Frontend**         | Next.js 15 (React 19)  | `src/app/`               |
| **UI Components**    | Vanilla CSS / Tailwind | `src/components/`        |
| **API Gateway**      | tRPC                   | `src/server/routers/`    |
| **Logic/Middleware** | Node.js TS             | `src/server/middleware/` |
| **Persistence**      | Drizzle ORM            | `src/db/schema/`         |
| **Database**         | PostgreSQL             | `Host:5432`              |

---

## 📁 2. Directory Taxonomy

### `src/app/` (Runtime Routes)

Deterministic Next.js App Router structure.

- `layout.tsx`: SSOT for UI shell and providers.
- `page.tsx`: Route-specific logic.
- `api/trpc/`: The unified API bridge.

### `src/server/` (Business Logic)

- `routers/`: Single-purpose domain routers (e.g., `user.ts`, `auth.ts`).
- `middleware/`: Hardened security and rate-limiting gates.
- `trpc.ts`: The bridge configuration (context and procedures).

### `src/db/` (Storage Layer)

- `schema/`: Physical table definitions and relations.
- `index.ts`: The Drizzle-Postgres client instance.

### `src/lib/` (Cross-Cutting Concerns)

- `env.ts`: Zod-based environment variable enforcement.
- `utils.ts`: Tailwind class merging (`cn`) and UI utilities.

---

## 🔄 3. Data Propagation Flow

1. **User Interaction:** Client-side event in `src/app/`.
2. **Procedure Call:** Type-safe tRPC invoke (`trpc.[domain].[procedure].useMutation`).
3. **Gateway Middleware:** Auth and rate-limiting validation in `src/server/middleware/`.
4. **Execution:** Procedure logic interacts with `src/db/`.
5. **Reconciliation:** Result propagates back to the UI with automatic query cache invalidation.

---

## 🛡️ 4. Architectural Constraints

1. **Server-First:** Prefer React Server Components (RSC) for initial data fetching.
2. **Schema-Driven:** No database write is permitted without a corresponding Drizzle Schema update.
3. **Isolation:** The `Iron Curtain` protocol prevents Development code from accessing Production databases.
4. **Agent-Aware:** All files are structured to enable recursive discovery by autonomous agents via standard filesystem tools.

---

_ASANMOD v1.0.0 | Architecture Kilitlendi_
