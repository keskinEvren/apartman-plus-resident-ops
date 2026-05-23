---
type: reference
agent_role: all
context_depth: 3
required_knowledge: ["conventions", "asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Implementation Patterns

> **Technical blueprints for feature development.**

---

## 📄 1. Page Implementation (Next.js 15)

Pages must be organized by domain. Always separate layouts from specific page content.

```tsx
// src/app/dashboard/layout.tsx (Shared Shell)
// src/app/dashboard/profile/page.tsx (Specific Route)

import { Suspense } from "react";
import { ProfileSkeleton } from "@/components/skeletons";

export default async function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileView />
    </Suspense>
  );
}
```

---

## 🔌 2. API Procedure (tRPC)

All procedures require absolute type-safety via Zod and must handle authentication at the gateway.

```typescript
// src/server/routers/user.ts
export const userRouter = router({
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(users).set(input).where(eq(users.id, ctx.user.id));
    }),
});
```

---

## 🗃️ 3. Persistence Layer (Drizzle ORM)

Schemas must reside in individual domain files within `src/db/schema/`.

```typescript
// src/db/schema/audits.ts
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Migration Sequence:**

1. `npm run db:generate` - Generates SQL.
2. `npm run db:migrate` - Applies to physical DB.
3. `npm run verify` - Validates type-parity.

---

## 🎨 4. Client Interactivity (Tailwind + Framer)

Use `cn()` utility for conditional class merging and `'use client'` at the component boundary.

```tsx
"use client";
import { cn } from "@/lib/utils";

export function ActiveButton({ isActive, children }: { isActive: boolean }) {
  return (
    <button
      className={cn(
        "px-4 py-2 transition-transform",
        isActive ? "scale-105 bg-blue-600" : "bg-gray-200",
      )}
    >
      {children}
    </button>
  );
}
```

---

## 🔄 5. Data Flow (Server-to-Client)

1. **RSC Fetch:** Initial page data (Metadata, Layout).
2. **tRPC Query:** User interactivity (Forms, Dynamic Lists).
3. **Optimistic UI:** Use `useOptimistic` for instantaneous feedback on mutations.
4. **Invalidation:** Always `utils.router.invalidate()` after successful mutations.

---

_ASANMOD v1.0.0 | Standardized Execution_
