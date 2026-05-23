---
type: task_list
agent_role: all
context_depth: 5
required_knowledge: ["asanmod_core"]
last_audited: "2026-02-05"
critical: true
---

# 🤖 AGENT FIRST PLAN (Chronological Onboarding)

> **Instructions for Agent:** Follow this plan strictly. Do not skip steps.
> **Philosophy:** You are the **Technical Lead**. The User is your partner, but YOU drive the technical implementation. The ASANMOD Wizard is your primary tool for initialization.

---

## 🛠️ PHASE 1: System Baseline

- [ ] **Read Governance** | EXEC: `cat docs/asanmod-core.json docs/AGENT_QUICK_REF.md` | CHECK: Understand the "Iron Curtain" protocol.
- [ ] **Install Dependencies** | EXEC: `npm install` | CHECK: `ls node_modules` confirms installation.

### 🧙‍♂️ AGENTIC WIZARD PROTOCOL

The `npm run wizard` command is now **Self-Adaptive**. It will detect the environment (OS, Ports, DB) and negotiate configuration with you.

**Interaction Strategy:**

1. **Analyze:** The wizard will print "Detected Environment". Read it.
2. **Negotiate:** It will propose Ports (e.g., 3000, 3002). If they are taken, it finds others. Trust it.
3. **Input:** It will ask for:
   - Project Name
   - Description
   - Modules (1=auth, 2=users, etc.)
   - DB Credentials (only if default `postgres:postgres` fails)

**Action:**

- [ ] **Run AI Wizard** | EXEC: `npm run wizard`
- **Response Pattern:**
  - `Project Name`: Provide the user's project name.
  - `Description`: Provide a short description.
  - `Modules`: "1,2,3" (or as requested).
  - `DB`: If asked, provide credentials.

- [ ] **Verify Setup** | EXEC: `cat docs/asanmod-core.json` | CHECK: Ensure `network.dev.frontend` matches the negotiated port.

## 🗄️ PHASE 2: Infrastructure Sync

> _Note: The Wizard attempts to create .env and DB. This phase is for verification and fallback._

- [ ] **Database Verification** | EXEC: `npm run db:push`
  - If it fails, check `.env` and `npm run doctor`.
- [ ] **Seed Data** | EXEC: `npm run seed` | CHECK: Manifest flags.
- [ ] **Admin Account** | EXEC: `npm run create-admin`

## 🔍 PHASE 3: Quality Gate Verification

- [ ] **Health Check** | EXEC: `npm run health` | CHECK: `cat .asanmod/manifest.json`

## 🟢 PHASE 4: Activation

- [ ] **Start Dev Mode** | EXEC: `npm run dev`
  - **Important:** Use the port defined in `docs/asanmod-core.json` (defaults to 3000, but Wizard may have moved it).
- [ ] **Final Check** | EXEC: `curl http://localhost:<PORT>`

---

## 🔒 HARD RULES FOR AGENTS

1. **Full Autonomy**: If the Wizard fails, debug `scripts/mod-tools/asan-wizard.js`. Fix it.
2. **Dynamic Ports**: NEVER assume Port 3000. Always read `docs/asanmod-core.json`.
3. **0/0/0 Policy**: No commits without `npm run verify`.
4. **Iron Curtain**: Respect DEV/PROD isolation.

_Verified by ASANMOD Governance v1.0.0_
