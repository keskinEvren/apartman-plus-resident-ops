---
type: reference
agent_role: security_specialist
context_depth: 4
required_knowledge: ["jwt", "network_isolation", "hard_constraints"]
last_audited: "2026-01-18"
critical: true
---

# ASANMOD Technical Security & Isolation (v1.0.0)

> **Security in ASANMOD is not a suggestion; it is a build-time constraint.**

This document outlines the technical implementation of security layers, forced through scriptable rules and infrastructure isolation.

---

## 🛡️ 1. Iron Curtain Isolation (Network)

ASANMOD enforces physical runtime isolation between environments to prevent credential leakage and accidental production data mutation.

| Rule                       | Implementation                                   | Verification        |
| :------------------------- | :----------------------------------------------- | :------------------ |
| **PROD Binding**           | Forced to `127.0.0.1` in `ecosystem.config.cjs`. | `npm run health`    |
| **Environment Separation** | Separate `.env` and `.env.prod`.                 | `env-helper.cjs`    |
| **Isolated Databases**     | No shared DB between DEV and PROD.               | `db-sync-check.cjs` |

---

## 🔒 2. Authentication Protocol (Stateless JWT)

Implementation details for the mandatory stateless authentication layer.

### Secret Management

- **JWT_SECRET:** Must be ≥32 characters. Enforced by `src/lib/env.ts` at startup.
- **Credential Storage:** bcrypt (12 rounds) hashing is mandatory.

### Token Enforcement

```typescript
// Standard ASANMOD Verification Gate
const payload = jwt.verify(token, process.env.JWT_SECRET!);
if (!payload.userId) throw new UnauthorizedError();
```

---

## 🏗️ 3. Input Hardening (Zod Gates)

Zero-trust policy for input data. Every tRPC procedure MUST have a Zod schema.

```typescript
// Enforced at API Gateway (tRPC)
export const procedure = protectedProcedure
  .input(
    z.object({
      id: z.string().cuid(),
      email: z.string().email(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Logic runs only if input matches schema perfectly
  });
```

---

## 🚫 4. Write Protection & Persistence

Security constraints enforced during file operations and database writes.

### Deterministic DB Safety

- **No Raw SQL:** Use Drizzle ORM parameterized queries exclusively.
- **Enum Safety:** All enum values across Postgres and TypeScript must be identical. Enforced by `npm run verify`.

### Agent Write Gates

`asanmod_safe_write` (via MCP) verifies code integrity before committing to disk. Any code containing security anti-patterns (e.g., hardcoded tokens) is rejected by the gate.

---

## 🩺 5. Continuous Security Auditing

| Tool                        | Checked Security Constraint                                    |
| :-------------------------- | :------------------------------------------------------------- |
| `npm run verify`            | Dependency vulnerabilities (`npm audit`) and lint errors.      |
| `scripts/mod-tools/pm diag` | Runtime leak detection and unauthorized port bindings.         |
| `verify-core.cjs`           | Enforces that agents only use approved MCP tools for file ops. |

---

## 🟢 Security Constants

- **Language:** ENGLISH for security logs and error codes.
- **Timezone:** UTC (All security events use UTC timestamps).
- **Session Duration:** 7 days (standard) or 30 minutes (strict administrative).

---

_ASANMOD v1.0.0 | Security Enforced via Logic_
