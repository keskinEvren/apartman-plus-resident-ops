---
type: reference
agent_role: all
context_depth: 3
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
critical: true
---

# 🚀 ASANMOD AGENT QUICK REFERENCE (v1.0.0)

> **Single page, all information. Read asanmod-core.json first.**

---

## 🔒 HARD CONSTRAINTS

| Rule                                  | Enforcement         |
| ------------------------------------- | ------------------- |
| Commit format: `type(scope): message` | `.husky/commit-msg` |
| Ports from asanmod-core.json          | Configuration file  |

---

## 🌐 NETWORK (from asanmod-core.json)

| Environment | App Name | Port |
| ----------- | -------- | ---- |
| **DEV**     | app-dev  | 3000 |
| **PROD**    | app-prod | 3002 |

---

## 🔑 ESSENTIAL COMMANDS

### Development

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run lint           # Run ESLint
npm run fix            # Auto-fix lint issues
```

### Database

```bash
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:ensure      # Create database if missing (deterministic)
npm run db:push        # Push schema (dev only)
npm run seed           # Seed database
npm run create-admin   # Create admin user
npm run backup         # Backup database
npm run restore        # Restore database
```

### Production & Deployment

```bash
npm run verify         # Full quality check (lint+typecheck+build)
npm run verify:code-change  # Verify for standard code-change risk
npm run verify:db-migration # Verify for db-migration risk (strict profile)
npm run deploy-prod    # Safe production deployment
npm run health         # System health check
```

---

## ⚡ PM2 COMMANDS (v10.0 - AI-Responsive)

### Standard Commands

```bash
./scripts/mod-tools/pm dev status      # Check dev status
./scripts/mod-tools/pm dev restart     # Restart dev
./scripts/mod-tools/pm prod status     # Check prod status
./scripts/mod-tools/pm prod restart    # Restart prod
./scripts/mod-tools/pm prod logs       # View prod logs (last 100)
./scripts/mod-tools/pm prod logs-live  # Live streaming logs
```

### 🤖 AI-Responsive Commands (v10.0)

```bash
./scripts/mod-tools/pm dev errors      # Hata taraması (UTC+3)
./scripts/mod-tools/pm prod errors     # Prod hata taraması
./scripts/mod-tools/pm dev diag        # Tam diagnostic rapor
./scripts/mod-tools/pm prod diag       # Prod diagnostic
./scripts/mod-tools/pm dev health      # Servis sağlığı
./scripts/mod-tools/pm dev memory      # Memory kullanımı
```

> **🤖 Agent İpucu:** Hata mı var? Önce `./scripts/mod-tools/pm dev errors` çalıştır!

---

## 📋 COMMIT FORMAT

```bash
feat(auth): add login validation
fix(api): resolve CORS issue
docs(readme): update installation
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 📚 DOCUMENTATION

- `asanmod-core.json` - Core config (READ FIRST)
- `GETTING_STARTED.md` - Complete setup guide
- `GEMINI.md` - Gemini protocol
- `CURSOR.md` - Cursor protocol
- `CLAUDE.md` - Claude protocol

---

_ASANMOD v10.0 - AI-Responsive PM2_
