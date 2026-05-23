---
type: reference
agent_role: all
context_depth: 2
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0 DOCUMENTATION REGISTRY

<!--
ASANMOD v1.0.0 - DOCUMENTATION HEADER
ID: REGISTRY-001
STATUS: ACTIVE
TYPE: INDEX
LAST_UPDATED: 2026-01-18 (UTC)
VERSION: v1.0.0
-->

> **Source of Truth:** This file lists ALL valid ASANMOD v1.0.0 documentation for the Enterprise Template. Any file NOT listed here does not exist in this template.

---

## 🏛️ CORE DOCUMENTATION

| ID            | Filename                                                  | Status     | Version | Description                                |
| :------------ | :-------------------------------------------------------- | :--------- | :------ | :----------------------------------------- |
| **CONST-001** | [`README.md`](../README.md)                               | **ACTIVE** | v1.0.0  | Project overview and quick start           |
| **CONST-002** | [`GEMINI.md`](../GEMINI.md)                               | **ACTIVE** | v1.0.0  | Gemini agent protocol (FIRST RUN SEQUENCE) |
| **CONST-003** | [`CURSOR.md`](../CURSOR.md)                               | **ACTIVE** | v1.0.0  | Cursor agent protocol (FIRST RUN SEQUENCE) |
| **CONST-004** | [`CLAUDE.md`](../CLAUDE.md)                               | **ACTIVE** | v1.0.0  | Claude agent protocol (FIRST RUN SEQUENCE) |
| **CORE-001**  | [`docs/asanmod-core.json`](asanmod-core.json)             | **ACTIVE** | v1.0.0  | Machine-readable core configuration (SSOT) |
| **CORE-002**  | [`docs/AGENT_QUICK_REF.md`](AGENT_QUICK_REF.md)           | **ACTIVE** | v1.0.0  | Single-page agent reference (all commands) |
| **CORE-003**  | [`docs/GETTING_STARTED.md`](GETTING_STARTED.md)           | **ACTIVE** | v1.0.0  | Complete 8-step setup guide                |
| **CORE-004**  | [`docs/ASANMOD_DOC_REGISTRY.md`](ASANMOD_DOC_REGISTRY.md) | **ACTIVE** | v1.0.0  | This file - documentation index            |

---

## 📚 SETUP & DEPLOYMENT

| ID            | Filename                              | Status     | Version | Description                    |
| :------------ | :------------------------------------ | :--------- | :------ | :----------------------------- |
| **SETUP-002** | [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) | **ACTIVE** | v1.0.0  | Production deployment guide    |
| **SETUP-003** | [`.env.example`](../.env.example)     | **ACTIVE** | v1.0.0  | Environment variables template |

---

## 📖 ADDITIONAL GUIDES

| ID            | Filename                                        | Status     | Version | Description                  |
| :------------ | :---------------------------------------------- | :--------- | :------ | :--------------------------- |
| **GUIDE-001** | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)       | **ACTIVE** | v1.0.0  | System architecture overview |
| **GUIDE-002** | [`docs/CONVENTIONS.md`](CONVENTIONS.md)         | **ACTIVE** | v1.0.0  | Code conventions             |
| **GUIDE-003** | [`docs/PATTERNS.md`](PATTERNS.md)               | **ACTIVE** | v1.0.0  | Common patterns              |
| **GUIDE-004** | [`docs/GOTCHAS.md`](GOTCHAS.md)                 | **ACTIVE** | v1.0.0  | Common pitfalls              |
| **GUIDE-005** | [`docs/SECURITY.md`](SECURITY.md)               | **ACTIVE** | v1.0.0  | Security best practices      |
| **GUIDE-006** | [`docs/TESTING.md`](TESTING.md)                 | **ACTIVE** | v1.0.0  | Testing guide                |
| **GUIDE-007** | [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | **ACTIVE** | v1.0.0  | Troubleshooting guide        |

---

## 🛠️ SCRIPTS & TOOLS

| ID           | Filename                                                                  | Status     | Version | Description                                       |
| :----------- | :------------------------------------------------------------------------ | :--------- | :------ | :------------------------------------------------ |
| **TOOL-001** | [`scripts/mod-tools/pm`](../scripts/mod-tools/pm)                         | **ACTIVE** | v1.0.0  | PM2 wrapper script                                |
| **TOOL-002** | [`scripts/mod-tools/asan-wizard.js`](../scripts/mod-tools/asan-wizard.js) | **ACTIVE** | v1.0.0  | Project setup wizard                              |
| **TOOL-003** | [`scripts/mod-tools/asan-init.js`](../scripts/mod-tools/asan-init.js)     | **ACTIVE** | v1.0.0  | Project initialization                            |
| **TOOL-004** | [`scripts/create-admin.ts`](../scripts/create-admin.ts)                   | **ACTIVE** | v1.0.0  | Admin user creation                               |
| **TOOL-005** | [`scripts/seed.ts`](../scripts/seed.ts)                                   | **ACTIVE** | v1.0.0  | Database seeding                                  |
| **TOOL-006** | [`scripts/mod-tools/verify.sh`](../scripts/mod-tools/verify.sh)           | **ACTIVE** | v1.0.0  | Universal code quality verification (fast-verify) |
| **TOOL-007** | [`scripts/mod-tools/deploy-prod.sh`](../scripts/mod-tools/deploy-prod.sh) | **ACTIVE** | v1.0.0  | Production deployment                             |

---

## ⚙️ CONFIGURATION

| ID             | Filename                                          | Status     | Version | Description                  |
| :------------- | :------------------------------------------------ | :--------- | :------ | :--------------------------- |
| **CONFIG-001** | [`ecosystem.config.cjs`](../ecosystem.config.cjs) | **ACTIVE** | v1.0.0  | PM2 dev/prod configuration   |
| **CONFIG-002** | [`package.json`](../package.json)                 | **ACTIVE** | v1.0.0  | npm scripts and dependencies |
| **CONFIG-003** | [`tsconfig.json`](../tsconfig.json)               | **ACTIVE** | v1.0.0  | TypeScript configuration     |
| **CONFIG-004** | [`next.config.js`](../next.config.js)             | **ACTIVE** | v1.0.0  | Next.js configuration        |
| **CONFIG-005** | [`tailwind.config.js`](../tailwind.config.js)     | **ACTIVE** | v1.0.0  | Tailwind CSS configuration   |
| **CONFIG-006** | [`.husky/commit-msg`](../.husky/commit-msg)       | **ACTIVE** | v1.0.0  | Git commit message hook      |
| **CONFIG-007** | [`.husky/pre-commit`](../.husky/pre-commit)       | **ACTIVE** | v1.0.0  | Git pre-commit hook          |

---

## 🔄 UPDATE PROTOCOL

When modifying documentation:

1. **Check Registry**: Before reading/writing docs, check this registry
2. **Update Documentation**: Make your edits
3. **Update Registry**: If you create a NEW doc, add it to this registry
4. **Update Protocols**: If changing core rules, update `GEMINI.md`, `CURSOR.md`, `CLAUDE.md`
5. **Test**: Verify all links work

---

## 📝 QUICK LINKS

**For First-Time Users:**

1. Read [`README.md`](../README.md)
2. Run `npm run wizard` (MANDATORY)
3. Follow [`docs/GETTING_STARTED.md`](GETTING_STARTED.md)

**For AI Agents:**

1. Read your protocol ([`GEMINI.md`](../GEMINI.md), [`CURSOR.md`](../CURSOR.md), or [`CLAUDE.md`](../CLAUDE.md))
2. Read [`docs/asanmod-core.json`](asanmod-core.json)
3. Read [`docs/AGENT_QUICK_REF.md`](AGENT_QUICK_REF.md)

---

_Last Updated: 2026-01-18_
_Template Version: 1.0.0_
