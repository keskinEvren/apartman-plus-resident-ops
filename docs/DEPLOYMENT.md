---
type: documentation
agent_role: ops_engineer
context_depth: 5
required_knowledge: ["pm2", "iron_curtain"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Production Deployment Protocol

> **Deterministic propagation of code to Production runtime.**

---

## 🔒 1. Deployment Constraints

1. **Verify State:** No code can be deployed if `npm run verify` fails.
2. **Iron Curtain:** Use `.env.prod` for production bindings.
3. **SSOT:** PM2 process names must follow `app-prod` as defined in `ecosystem.config.cjs`.

---

## 🚀 2. Propagation Sequence (Manual/Scripted)

### Stage 1: Local Verification

```bash
npm run verify
```

### Stage 2: Target Synchronization

```bash
# Triggers atomic deployment via SSH or Local script
npm run deploy-prod
```

### Stage 3: Runtime Activation

The `deploy-prod` script performs:

1. `npm ci` (Clean install)
2. `npm run build` (Next.js Standalone build)
3. `drizzle-kit migrate` (Schema propagation)
4. `pm prod restart` (Atomic process swap)

---

## 🩺 3. Post-Deployment Validation

| Action             | Command               | Success Criterion         |
| :----------------- | :-------------------- | :------------------------ |
| **Process Status** | `pm prod status`      | `online` with 0 restarts. |
| **Health Check**   | `curl 127.0.0.1:3002` | HTTP 200 OK.              |
| **Diagnostic**     | `pm prod diag`        | No critical log entries.  |

---

## 🏗️ 4. Environment Bindings

| Var              | Production Status                      |
| :--------------- | :------------------------------------- |
| **NODE_ENV**     | `production`                           |
| **PORT**         | `3002` (Internally bound)              |
| **DATABASE_URL** | Direct connection to Physical Prod DB. |

---

## 🔄 5. Rollback Procedure

In case of `v1.0.0` failure, revert to the previous Git tag and re-run deployment:

```bash
git checkout <last_tag>
npm run deploy-prod
```

---

_ASANMOD v1.0.0 | Deployment Hardened_
