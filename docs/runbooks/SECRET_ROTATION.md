# Secret Rotation

## Trigger

- Secret scan gate fails.
- Any credential is exposed in commit history, logs, or screenshots.

## Detection

- Run `npm run secret:scan:check`.
- Review failing file+line references in gate output.

## Rotation Flow

1. Revoke and regenerate exposed credentials on provider side.
2. Replace local values in `.env` only (never tracked files).
3. Keep placeholders in `.env.example` and docs.
4. Validate with `npm run secret:scan:check`.

## Verification

- Run `npm run verify:code-change` and confirm all gates pass.
- Add an entry to `docs/backlog/TEMPLATE_IMPROVEMENT_BACKLOG.md` if process needed template changes.
