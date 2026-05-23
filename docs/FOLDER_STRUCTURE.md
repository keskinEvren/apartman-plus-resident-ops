---
type: reference
agent_role: all
context_depth: 3
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Folder Structure & Scaling Protocols

> **Rules for structural integrity as the project scales from MVP to Enterprise.**

---

## 📁 1. Baseline Taxonomy (Small-to-Medium)

```bash
src/
├── app/          # Next.js App Router (Routing Root)
├── components/   # Atomic UI components
├── db/           # Persistence Layer (Meta-schema)
├── lib/          # Infrastructure utilities (JWT, Env, tRPC)
└── server/       # API Gateway and Middleware
```

---

## 🚀 2. Enterprise Scaling Protocol (30+ Procedures)

When a domain (e.g., `Billing`, `Admin`) exceeds 5 procedures, it MUST be extracted into a subdirectory.

### Scaled Router Pattern

```bash
src/server/routers/billing/
├── index.ts      # Aggregator (appRouter entry)
├── invoices.ts   # Procedure set A
└── payments.ts   # Procedure set B
```

### Scaled DB Schema

```bash
src/db/schema/
├── auth.ts       # Identity tables
├── transactions.ts # Monetary tables
└── index.ts      # Global export SSOT
```

---

## 🎯 3. Reorganization Trigger Points

| Trigger                         | Action                                                 | Enforcement      |
| :------------------------------ | :----------------------------------------------------- | :--------------- |
| **File > 200 lines**            | Logic extraction to `internal_utils.ts` or sub-module. | `npm run audit`  |
| **Logic Reuse > 2 places**      | Move to `src/lib/[category]/`.                         | Architect Review |
| **Domain Procedural Load > 10** | Split into domain-indexed folder.                      | Mandatory        |
| **Prop Drilling > 3 levels**    | Implement React Context in `src/app/providers.tsx`.    | Mandatory        |

---

## 🕵️ 4. Rule of Proximity

1. **Local State:** Keep in the component file.
2. **Domain State:** Keep in the feature folder.
3. **Global Infrastructure:** Keep in `src/lib/` or `asanmod-core.json`.

---

_ASANMOD v1.0.0 | Structural Parity Active_
