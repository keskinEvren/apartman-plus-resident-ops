# Safe Update Protocol

## Trigger

- Template self-update or governance update is required.

## Update Sequence

1. Snapshot current state (branch, commit, critical artifacts).
2. Apply minimal scoped change.
3. Run domain checks + verify chain.
4. Record evidence and change summary.

## Rollback

- If blocking gates remain failing after deterministic fixes:

1. Revert scoped update commit(s).
2. Restore last passing state.
3. Re-run verify to confirm recovery.
