# Port and Env Drift

## Trigger

- `port_env_consistency` gate fails.
- `.env` values diverge from `docs/asanmod-core.json` or install lock.

## Detection

1. Compare `.env` `PORT` and URLs.
2. Compare `docs/asanmod-core.json` `network.dev/prod` values.
3. Compare `.asanmod/install.lock.json` `ports`.

## Fix

1. Run `npm run agent:init -- --auto` (or wizard flow) to resync.
2. Recheck `npm run verify:code-change -- --dry-run`.
3. Confirm lock/core/env values are aligned.
