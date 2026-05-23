---
type: reference
agent_role: qa_engineer
context_depth: 3
required_knowledge: ["jest", "asanmod_core"]
last_audited: "2026-01-18"
---

# ASANMOD v1.0.0: Technical Validation (Testing)

> **Protocols for automated verification of system integrity.**

---

## 🧪 1. Execution Commands

| Target         | Command                  | Purpose                                  |
| :------------- | :----------------------- | :--------------------------------------- |
| **Full Suite** | `npm run test`           | Validates all `.test.ts` files globally. |
| **Surgical**   | `npm run test -- [path]` | Tests a specific module/file.            |
| **Watch**      | `npm run test:watch`     | Continuous feedback during refactoring.  |
| **Coverage**   | `npm run test:coverage`  | Generates HTML/LCOV reports.             |

---

## 🏗️ 2. Validation Layers

### 2.1 Unit Validation (Utilities)

Focus on side-effect-free logic in `src/lib/`.

```typescript
it("converts strings to slug format", () => {
  expect(slugify("Hello World")).toBe("hello-world");
});
```

### 2.2 Integration Validation (tRPC)

Testing procedures via direct caller invocation.

```typescript
const caller = appRouter.createCaller(ctx);
const result = await caller.user.getById({ id: "123" });
expect(result.email).toBeDefined();
```

### 2.3 UI Validation (React Testing Library)

Testing interactive components in `src/components/`.

```tsx
render(<SubmitButton onClick={mockFn} />);
fireEvent.click(screen.getByRole("button"));
expect(mockFn).toHaveBeenCalledTimes(1);
```

---

## 🛡️ 3. Mocking & Isolation

- **DB Mocking:** Isolate procedures from the physical PostgreSQL instance using manual mocks or `pg-mem`.
- **Global Auth:** Mock the `ctx.user` in `createContext` to simulate different RBAC states without real JWT signing.

---

## 📊 4. Coverage Thresholds (Enforced)

The build will WARNING if coverage falls below these levels:

- **Statements:** 80%
- **Branches:** 70%
- **Functions:** 80%

---

_ASANMOD v1.0.0 | Quality Enforced_
