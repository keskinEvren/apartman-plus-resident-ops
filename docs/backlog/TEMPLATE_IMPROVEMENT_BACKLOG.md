# Template Improvement Backlog

This file is the single source of truth for template hardening findings.
Policy: append-only updates; do not delete historical findings.

## 2026-03-03 16:30 - Consolidated Findings

### TB-001

- Finding: Secret leakage risk via local `.env` (real API keys can be accidentally committed).
- Evidence: Local preflight reported `GEMINI_API_KEY="AIza..."` in `.env`.
- Impact: Credential exposure and account compromise risk.
- Proposed Fix:
  - Keep `.env` untracked.
  - Add strict secret-scan in pre-commit/pre-push (block on high-confidence patterns).
  - Add runbook entry for secret rotation.
- Priority: Critical
- Status: done (2026-03-03)
- Resolution:
  - Added `scripts/mod-tools/secret-scan-check.cjs`.
  - Integrated `secret_scan_check` gate into profiles/hooks.
  - Added `docs/runbooks/SECRET_ROTATION.md`.

### TB-002

- Finding: DB bootstrap flow is not deterministic when target database does not exist.
- Evidence: `npm run db:push` failed on first run with missing DB, manual `createdb` required.
- Impact: First-run friction and false-negative setup failures.
- Proposed Fix:
  - Add `db:ensure` script (create DB if missing, then run push/migrate).
  - Call it from `agent:init` or first-run bootstrap.
- Priority: High
- Status: done (2026-03-03)
- Resolution:
  - Added `scripts/mod-tools/db-ensure.cjs`.
  - Added `db:ensure` and `db:ensure:check` scripts.
  - Wired `db:push` to run `db:ensure` first.

### TB-003

- Finding: Verify argument handling/messages are not fully aligned (historical confusion around `--risk` pass-through).
- Evidence: Prior runs showed inconsistent command echoing and confusion in verify invocation.
- Impact: DX confusion, higher operator error probability.
- Proposed Fix:
  - Normalize `npm run verify -- --risk <class>` handling.
  - Add explicit argument examples in README and runbook.
- Priority: Medium
- Status: done (2026-03-03)
- Resolution:
  - Added risk-specific aliases (`verify:code-change`, `verify:db-migration`, etc.).
  - Normalized arg parsing in `verify-universal.cjs`.
  - Updated docs/runbooks to use normalized verify command examples.

### TB-004

- Finding: Migration naming quality is inconsistent (`0000_flashy_abomination.sql` style names).
- Evidence: Generated migration naming is non-descriptive in reported MVP run.
- Impact: Poor auditability and harder rollback/change-trace.
- Proposed Fix:
  - Introduce migration naming convention guard.
  - Add check script for descriptive migration labels.
- Priority: Medium
- Status: done (2026-03-03)
- Resolution:
  - Added `scripts/mod-tools/migration-name-check.cjs`.
  - Integrated `migration_name_check` gate into profiles/hooks.

### TB-005

- Finding: `reports/expert/*` commit policy is not explicit.
- Evidence: Expert reports were generated but inclusion policy was unclear during commit safety review.
- Impact: Inconsistent repository hygiene and audit trail quality.
- Proposed Fix:
  - Define policy in docs (`required` vs `optional` by mode/profile).
  - Add gate or checklist enforcement.
- Priority: Medium
- Status: done (2026-03-03)
- Resolution:
  - Added `docs/EXPERT_REPORT_POLICY.md`.
  - Added `config/asanmod-universal/expert-reports-policy.json`.
  - Added `scripts/mod-tools/expert-reports-policy-check.cjs` and gate integration.

### TB-006

- Finding: Hardcoded password traces exist in non-MVP legacy tooling paths.
- Evidence: Security scan flagged hardcoded `PGPASSWORD` assignment under `mcp-servers/...`.
- Impact: Secret hygiene debt; potential future leakage.
- Proposed Fix:
  - Replace hardcoded secrets with env references.
  - Add secret scan rule for these paths.
  - Rotate referenced credentials if active.
- Priority: High
- Status: done (2026-03-03)
- Resolution:
  - Removed hardcoded password defaults from MCP tooling paths.
  - Replaced with env-driven resolution (`DB_PASS`/`DB_PASSWORD`/`PGPASSWORD`).
  - Protected by secret scan gate in hook chain.

### TB-007

- Finding: Pre-push hook initially blocked branch delete refs (`local_sha=000...`).
- Evidence: Remote branch delete failed until hook was patched.
- Impact: Branch lifecycle friction.
- Proposed Fix: Keep delete-ref bypass in pre-push fast-forward check.
- Priority: Low
- Status: done

### TB-008

- Finding: Docs impact parser initially misread some `git status --porcelain` lines and directory entries.
- Evidence: False negatives for `README.md` and `docs/runbooks/README.md` in dependency checks.
- Impact: Incorrect gate outcomes (false FAIL/PASS risk).
- Proposed Fix: Keep robust parser + directory expansion logic.
- Priority: Medium
- Status: done

### TB-009

- Finding: Full-repo format check is impractical for historically non-normalized repos.
- Evidence: `format:check` flagged very large pre-existing set on first integration.
- Impact: Blocks incremental development.
- Proposed Fix: Keep changed-files scoped format check for fail-close practicality.
- Priority: Medium
- Status: done

### TB-010

- Finding: Runbook coverage was missing for self-heal/self-update operations.
- Evidence: User requirement and initial repo state lacked dedicated operational runbooks.
- Impact: Operational inconsistency during incidents.
- Proposed Fix: Added runbook suite + `runbook:check` gate integration.
- Priority: High
- Status: done

## Next Execution Order

1. Monitor new backlog items after next agent stress-test cycle.
2. Keep TB-001..TB-006 regressions blocked by gates/hooks.
