---
type: reference
agent_role: all
context_depth: 2
required_knowledge: ["asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Coding Conventions

> **Deterministic constraints for naming, structure, and style.**

---

## 📁 1. Physical Structure

| Entity         | Convention        | Example                              |
| :------------- | :---------------- | :----------------------------------- |
| **Pages**      | `kebab-case`      | `src/app/auth/login/page.tsx`        |
| **Components** | `PascalCase`      | `src/components/UserCard.tsx`        |
| **Utilities**  | `camelCase`       | `src/lib/formatDate.ts`              |
| **Types**      | `PascalCase`      | `src/types/auth.ts` -> `AuthContext` |
| **Constants**  | `SCREAMING_SNAKE` | `const MAX_SESSION_TTL = 3600;`      |

---

## 🏷️ 2. Naming Constraints

### Logic (TS/JS)

- **Functions:** `camelCase` with descriptive verbs (`getUser`, `validateInput`).
- **Variables:** `camelCase` nouns. No single-letter variables except in map/filter callbacks.
- **Interfaces/Types:** `PascalCase`. No `I` prefix for interfaces.

### API (tRPC)

- **Routers:** `camelCase` (singular). e.g., `trpc.auth.login`.
- **Procedures:** `camelCase` (verb-noun). e.g., `getProfile`, `updateSettings`.

### Database (PostgreSQL)

- **Tables:** `snake_case` (plural). e.g., `organizations`, `login_attempts`.
- **Columns:** `snake_case`. e.g., `created_at`, `is_active`.

---

## 🧬 3. Architecture Patterns

### Components

- **Client Dir:** Use `'use client'` ONLY when React hooks (useState, etc.) or browser APIs are required.
- **Server Dir:** Default. Use for data fetching and heavy logic.

### State Management

- **URL First:** Use search params for shareable state.
- **tRPC:** Use for all client-server communication.
- **Local:** Use `useState` sparingly; prefer scoped context.

---

## 🔒 4. Hard Prohibited Practices

- **Zero console.log:** Enforced by `.husky/pre-commit`. Use a dedicated logger if needed.
- **Zero any:** Any use of `any` triggers an immediate build failure. Use `unknown` or defined generics.
- **No Hardcoded IDs:** Read `asanmod-core.json` for ports and project identifiers.
- **No Inline Styles:** Use Tailwind classes exclusively.

---

## 📋 5. Git Discipline (v1.0.0)

**Format:** `type(scope): message`

**Valid Types:**

- `feat`: New feature or capability.
- `fix`: Technical bug resolution.
- `docs`: Metadata or documentation updates.
- `refactor`: Structural change without logic alteration.
- `test`: Addition/modification of test suites.
- `chore`: Dependency updates or maintenance.

---

_ASANMOD v1.0.0 | Conventions Enforced_
