# Agent Drift Control

## Trigger

- Different agents generate conflicting behavior or docs.
- Contract/mirror mismatch appears after agent-led edits.

## Control Rules

- Contract configs under `config/asanmod-universal/` are source of truth.
- Mirror docs must pass `docs:sync:check`.
- Any agent output must preserve `reason/fix/next` error protocol.

## Recovery

1. Reapply canonical config-driven scripts.
2. Run docs sync and template checks.
3. Run verify chain for the active profile.
