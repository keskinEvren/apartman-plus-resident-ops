# Incident Triage

## Trigger

- Production or development runtime fails.
- Health endpoint, verify gate, or key user flow returns failure.

## First 10 Minutes

1. Freeze mutating actions.
2. Capture current branch, commit, timestamp, and failing command.
3. Run read-only diagnostics (`npm run status`, logs, verify dry-run).
4. Classify impact and owner.

## Severity

- `SEV-1`: data loss risk, production outage, auth/security break.
- `SEV-2`: core flow degraded, no data loss.
- `SEV-3`: non-critical defect.

## Output Contract

- reason: exact failure and blast radius
- fix: deterministic remediation command/path
- next: immediate next executable step
