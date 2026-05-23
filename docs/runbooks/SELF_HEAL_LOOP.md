# Self Heal Loop

## Trigger

- `npm run verify` fails on blocking gates.
- Runtime drift detected by agents or hook chain.

## Flow

1. Detect: capture failing gate(s), file(s), and evidence.
2. Classify: docs/code/db/ops risk class.
3. Heal: apply smallest deterministic fix.
4. Verify: rerun affected checks and full required profile checks.
5. Record: save evidence artifacts.

## Evidence

- reports/healing `json` + `md` with timestamp
- gate list before/after
- changed files and commands

## Exit Criteria

- All blocking gates pass.
- Evidence artifacts exist and are readable.
- No unresolved blocker remains.
