# Gate Failure Playbook

## Trigger

- Any blocking gate returns FAIL during pre-commit, pre-push, or verify.

## Gate Remediation Matrix

- `version_lock_check`: run `npm run version:sync` then `npm run version:lock:check`
- `structure_check`: align files to architecture map zones/extensions
- `docs_template_check`: add required headings from `doc-templates.json`
- `docs_impact_check`: update related files in `docs-graph.json`
- `schema/api/perf/modular/ui/format`: run corresponding domain checks and refactor/fix
- `lint/type_check/test/build`: resolve code and runtime issues then rerun

## Retry Rule

1. Fix only failing domain.
2. Rerun domain check.
3. Rerun profile verify chain.
4. If still failing, escalate with `reason/fix/next`.
