---
type: documentation
agent_role: all
context_depth: 5
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Deterministic Setup Protocol

> **8-Step Technical Onboarding for Human and AI Operators.**

---

## 📋 1. Prerequisites (Hardware & Environment)

| Requirement    | Specification           | Enforcement              |
| :------------- | :---------------------- | :----------------------- |
| **Node.js**    | v20.x or higher         | `package.json > engines` |
| **PostgreSQL** | v14.x or higher         | `src/lib/env.ts`         |
| **Git**        | Required (Husky active) | `prepare` script         |
| **OS**         | Linux / macOS preferred | CI/CD Compatibility      |

---

## 🚨 2. Git Initialization (Mandatory)

The framework utilizes Husky hooks for quality enforcement. A Git repository is required.

```bash
git clone <repo_url>
cd <project_dir>
# Verify .git directory exists
ls -d .git
```

---

## 📦 3. Dependency Installation

```bash
npm install
```

**Automated Actions:**

- Triggers `scripts/mod-tools/asan-wizard.js` on first run.
- Installs Husky hooks (`.husky/commit-msg`, `.husky/pre-commit`).
- Verifies package-lock integrity.

---

## 🗄️ 4. PostgreSQL Configuration

### Physical DB Creation

```bash
psql -U postgres -c "CREATE DATABASE [PROJECT]_dev_db;"
```

---

## ⚙️ 5. Environment Synchronization (SSOT)

```bash
cp .env.example .env
```

### Mandatory Bindings in `.env`:

- **DATABASE_URL:** Valid PostgreSQL connection string.
- **JWT_SECRET:** Secure string (min 32 chars).
- **ADMIN_EMAIL/PASSWORD:** For initial administrative access.

---

## 🏗️ 6. Schema Propagation

```bash
npm run db:push
```

Forces the Drizzle schema onto the target database. Verification:

```bash
psql -d [DB_NAME] -c "\dt"
```

---

## 🔍 7. Quality Gate Baseline

Run a full verification pass to ensure the template is in a 0/0/0 state:

```bash
npm run verify
```

**Passing Criteria:**

1. Lint: No errors/warnings.
2. TypeScript: No non-emit errors.
3. Tests: All suites pass.
4. Security: `npm audit` cleanup.
5. Build: Production build success.

---

## 🟢 8. Activation (Isolated DEV)

```bash
npm run dev
```

- **Runtime:** `http://localhost:3000`
- **Isolation:** Operates under `app-dev` context.
- **Logging:** Continuous output to terminal.

---

## 🤖 AI Agent Onboarding Sequence

1. **Protocol Sync:** Read `GEMINI.md` (or relevant agent protocol).
2. **SSOT Load:** Read `docs/asanmod-core.json`.
3. **Task Alignment:** Follow `AGENT_FIRST_PLAN.md` sequence.
4. **Health Check:** Run `npm run status` before first commit.

---

_ASANMOD v1.0.0 | Setup Verified_
