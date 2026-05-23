# Scheduled Health Checks

## Daily Checks

- `npm run verify:code-change -- --dry-run`
- `npm run docs:sync:check`
- Runtime status/log scan

## Weekly Checks

- Full strict profile verification
- Dependency and security review
- Runbook relevance review

## Alert Thresholds

- Any blocking gate fail: immediate action
- Repeated non-blocking fail for 3 consecutive runs: escalate
- Missing evidence artifacts: mark run incomplete
