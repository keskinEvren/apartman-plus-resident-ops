# Recovery and Rollback

## Trigger

- Production-sensitive fix fails.
- Verify remains red after remediation attempts.

## Recovery Steps

1. Stop new mutating changes.
2. Recover known-good runtime/process state.
3. Validate minimum health and auth-critical paths.

## Rollback Steps

1. Identify last passing commit and artifact set.
2. Restore code/config to passing point.
3. Re-run gate chain and publish evidence.
