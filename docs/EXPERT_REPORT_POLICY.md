# Expert Report Policy

## Scope

This policy defines when `reports/expert/*` artifacts are required.

## Profile Rules

- `rapid`: optional
- `standard`: optional
- `strict`: required

## Required Artifacts (when required)

- `reports/expert/template-readiness-report.md`
- `docs/backlog/TEMPLATE_IMPROVEMENT_BACKLOG.md`

## Enforcement

- Gate: `npm run expert:reports:policy:check`
- Config source: `config/asanmod-universal/expert-reports-policy.json`

## Commit Guidance

- Expert reports are allowed in commit scope.
- Do not commit generated runtime evidence under `reports/verification/*` and `reports/healing/*`.
