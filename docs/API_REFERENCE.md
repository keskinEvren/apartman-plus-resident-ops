---
type: reference
agent_role: backend_engineer
context_depth: 3
required_knowledge: ["trpc_patterns", "asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: API Procedure Reference (tRPC)

> **Type-safe procedure definitions. All calls via `@/lib/trpc`.**

---

## 🔑 1. Authentication (`authRouter`)

### `login` (Mutation)

Authenticates a user and returns a stateless JWT.

- **Input:** `z.object({ email: z.string().email(), password: z.string() })`
- **Return:** `{ token: string, user: UserObject }`

### `register` (Mutation)

Creates a new user identity.

- **Input:** `z.object({ email: z.string().email(), password: z.string().min(8) })`
- **Return:** `{ success: boolean }`

### `getMe` (Query) - Protected

Retrieves the session identity of the current requester.

- **Return:** `UserObject | null`

---

## 👥 2. User Management (`userRouter`)

### `list` (Query) - Admin Only

Paginated retrieval of all system users.

- **Input:** `z.object({ page: z.number().default(1), limit: z.number().default(20) })`
- **Return:** `{ users: UserObject[], total: number }`

### `update` (Mutation) - Protected

Self-updates profile or administrative update of any user.

- **Input:** `z.object({ id: z.string().cuid(), name: z.string().optional() })`
- **Return:** `UserObject`

---

## ⚠️ 3. Error Contract

ASANMOD utilizes standard tRPC Error Codes mapped to HTTP statuses:

| tRPC Code               | HTTP | Description                                       |
| :---------------------- | :--- | :------------------------------------------------ |
| `UNAUTHORIZED`          | 401  | Missing or invalid JWT.                           |
| `FORBIDDEN`             | 403  | Insufficient RBAC permission.                     |
| `BAD_REQUEST`           | 400  | Zod validation failed.                            |
| `NOT_FOUND`             | 404  | Resource unique ID not found in DB.               |
| `INTERNAL_SERVER_ERROR` | 500  | Unhandled exception (check `logs/dev-error.log`). |

---

## 🛠️ 4. Integration Pattern

### React Component (Client)

```tsx
const { data, isLoading } = trpc.auth.getMe.useQuery();
```

### Server Side (RSC/Server Action)

```typescript
const user = await api.auth.getMe.query();
```

---

_ASANMOD v1.0.0 | API Protocol Hardened_
