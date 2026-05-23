---
type: reference
agent_role: quality_engineer
context_depth: 4
required_knowledge: ["asanmod_core", "verify_gate"]
last_audited: "2026-01-18"
critical: true
---

# ASANMOD v1.0.0: System Validation Protocol (E2E)

> **Objective:** Deterministic verification of the 0/0/0 quality policy and environment integrity.

---

## 🧪 1. Validation Task: "Domain Model Baseline"

**Scope:**

1. **User Authentication:** Registration, Login (JWT), and Profile Retrieval.
2. **Resource CRUD:** Todo/Task management scoped to the authenticated user.
3. **Database Parity:** Schema definition matching physical Drizzle indices.

---

## ✅ 2. Technical Success Criteria

### 2.1 Code Quality Enforcement

All commits must be preceded by a successful verification pass:

```bash
npm run verify
```

**Required State:**

- [x] ESLint: 0 errors / 0 warnings.
- [x] TypeScript: 0 non-emit errors.
- [x] Jest: 100% test suite pass rate.
- [x] Build: Production bundle generated successfully.

### 2.2 Hook Integrity Test

1. **Constraint Check (Log):** Attempt to commit with `console.log`. Expected: `REJECTED`.
2. **Constraint Check (Format):** Attempt to commit with non-conventional format. Expected: `REJECTED`.
3. **Constraint Check (Validation):** Attempt to commit valid code. Expected: `ACCEPTED`.

---

## 🚦 3. Interface Verification (CURL)

### Auth & Persistence Sequence

1. **Register:** `POST /api/auth/register` (Expected: 200 OK).
2. **Login:** `POST /api/auth/login` (Expected: 200 OK + JWT).
3. **Fetch:** `GET /api/todos` (Expected: 200 OK + Empty Array).
4. **Create:** `POST /api/todos` (Expected: 200 OK).
5. **Verify:** `GET /api/todos` (Expected: 200 OK + Array Length 1).

---

## 🗄️ 4. Physical Database Validation

- **Push:** `npm run db:push` (Expected: Parity established).
- **Structure:** `psql -c "\dt"` (Expected: `users` and `todos` tables present).
- **Parity:** `npm run db:sync-check` (Expected: No physical desync).

---

## 🏗️ 5. Production Parity Check (Iron Curtain)

```bash
npm run build
pm prod restart
curl http://localhost:3002 -f
```

**Criterion:** HTTP 200 OK returned via production port specified in `asanmod-core.json`.

---

## 📊 6. Automated Validation Script

```bash
#!/bin/bash
# ASANMOD v1.0.0 E2E Validator

echo "Running Verification Gates..."
npm run verify || exit 1

echo "Checking Git Discipline..."
[[ $(git status --porcelain) == '' ]] || (echo "STALE_FILES"; exit 1)

echo "Starting Temporary Runtime..."
npm run dev &
PID=$!
sleep 5

echo "Testing Register Procedure..."
# CURL sequence logic here...

kill $PID
echo "VALIDATION_COMPLETE"
```

---

_ASANMOD v1.0.0 | Technical Baseline Verified_
