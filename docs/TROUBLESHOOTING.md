---
type: reference
agent_role: ops_engineer
context_depth: 3
required_knowledge: ["asanmod_core", "pm2_wrapper"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Diagnostic & Troubleshooting

> **Deterministic resolution path for system instability.**

---

## 🛠️ 1. Diagnostic Execution (Primary Path)

If any part of the system is unresponsive, run the automated diagnostic tool immediately:

```bash
./scripts/mod-tools/pm dev diag
```

This tool validates:

1. **Port Bindings:** Checks if `app-dev` (3000) is online.
2. **Log Health:** Scans `logs/dev-error.log` for high-frequency crashes.
3. **Ghost Processes:** Detects PID mismatches.

---

## 🏗️ 2. Environment Issues

### ❌ Port Conflict (EADDRINUSE)

**Resolution:**

```bash
./scripts/mod-tools/pm dev stop
# Force kill remaining ghosts
npx kill-port 3000 3001
./scripts/mod-tools/pm dev start
```

### ❌ DB Connection Failure

**Resolution:**

1. Verify `DATABASE_URL` in `.env`.
2. Check PostgreSQL service status: `systemctl status postgresql`.
3. Test physical connectivity: `psql $DATABASE_URL -c "SELECT 1"`.

---

## 🔍 3. Build & Quality Failures

### ❌ Verification Gate Blocked

If `npm run verify` fails:

1. **Lint Phase:** Run `npm run fix`.
2. **Type Phase:** Check for missing tRPC router registrations or Zod schema mismatches.
3. **Build Phase:** Delete `.next` directory and retry: `rm -rf .next && npm run build`.

---

## 📦 4. Dependency Corruption

**Symptom:** Strange internal errors from `@trpc` or `next`.
**Resolution:**

```bash
rm -rf node_modules package-lock.json
npm install
npm run verify
```

---

## 🤖 5. For AI Agents (Ghost-Dev Protocol)

1. **Self-Diagnosis:** Always run `pm dev errors` before reporting to User.
2. **Persistence Check:** If a bug persists after 3 fix attempts, run `npm run verify` to detect hidden type errors.
3. **Hard Reset:** If the environment is state-corrupted, run `pm dev restart` and wait 5s for PID stabilization.

---

_ASANMOD v1.0.0 | Operational Status: Hardened_
