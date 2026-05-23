# Evidence Standard

## Required Artifacts

- Verification artifacts under `reports/verification`
- Healing artifacts under `reports/healing` when self-heal is used
- Command summary and gate results in final report

## File Naming

- Use ISO-like timestamp suffix
- Use deterministic prefixes (`verify-`, `heal-`, `ops-`)

## Completion Criteria

- Blocking gates are PASS
- Artifacts exist and are readable
- No unresolved `reason/fix/next` item remains open
