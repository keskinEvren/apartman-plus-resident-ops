---
type: reference
agent_role: all
context_depth: 3
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Technical Gotchas

> **Pre-emptive resolution for common architectural friction points.**

---

## 🏗️ 1. Hydration & Server Components

### Client Hooks in RSC

**Symtom:** `TypeError: (0 , react__WEBPACK_IMPORTED_MODULE_0__.useState) is not a function`
**Cause:** Attempting to use `useState`, `useEffect`, or `useContext` in a Server Component.
**Resolution:** Add `'use client'` at the top of the file or extract stateful logic to a separate component.

---

## 🔌 2. tRPC Procedural Discovery

### Router Recognition

**Symptom:** `Property 'newService' does not exist on type 'AppRouter'`
**Cause:** New router file created but not registered in `src/server/routers/_app.ts`.
**Resolution:**

```typescript
export const appRouter = router({
  old: oldRouter,
  new: newRouter, // <-- Ensure registration here
});
```

---

## 🛡️ 3. Iron Curtain Access Leaks

### Port Binding Conflict

**Symptom:** `EADDRINUSE: address already in use :::3000`
**Cause:** Development and Production attempting to bind to the same port, or a legacy process ghosting.
**Resolution:** Run `./scripts/mod-tools/pm diag`. Use `pm2 delete all` if state is corrupted.

---

## 🗃️ 4. Drizzle & DB Integrity

### Migration Drift

**Symptom:** `column "X" does not exist` despite `npm run db:migrate` success.
**Cause:** Physical schema drifted from Meta-schema (common during force-pushes).
**Resolution:** Run `npm run verify`. If drift persists, use `db-sync-check.cjs` to identify missing physical indices/columns.

### UTC Timestamp Enforcement

**Gotcha:** Postgres `timestamp` without timezone defaults to local server time.
**Enforcement:** Always use `timestamp("created_at", { withTimezone: true }).defaultNow()`.

---

## 🔒 5. Agent Constraints

### Git Hook Rejection

**Symptom:** `husky - commit-msg hook failed (add --no-verify to bypass)`
**Cause:** Commit message fails `type(scope): message` regex.
**Resolution:** Strictly follow `CONVENTIONS.md` Git section. NEVER use `--no-verify`.

---

_ASANMOD v1.0.0 | High-Signal Reference_
