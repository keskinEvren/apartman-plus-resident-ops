# Runbook Index

## Quick Routing

- Runtime failure: use `INCIDENT_TRIAGE.md`
- Auto remediation flow: use `SELF_HEAL_LOOP.md`
- Gate fail and fix mapping: use `GATE_FAILURE_PLAYBOOK.md`
- Port and env mismatch: use `PORT_ENV_DRIFT.md`
- Agent behavior drift: use `AGENT_DRIFT_CONTROL.md`
- Safe self-update cycle: use `SAFE_UPDATE_PROTOCOL.md`
- Recovery and rollback: use `RECOVERY_ROLLBACK.md`
- Evidence and closure policy: use `EVIDENCE_STANDARD.md`
- Scheduled stability control: use `SCHEDULED_HEALTH_CHECKS.md`
- Secret leak remediation: use `SECRET_ROTATION.md`

## Required Runbooks

- `docs/runbooks/INCIDENT_TRIAGE.md`
- `docs/runbooks/SELF_HEAL_LOOP.md`
- `docs/runbooks/GATE_FAILURE_PLAYBOOK.md`
- `docs/runbooks/PORT_ENV_DRIFT.md`
- `docs/runbooks/AGENT_DRIFT_CONTROL.md`
- `docs/runbooks/SAFE_UPDATE_PROTOCOL.md`
- `docs/runbooks/RECOVERY_ROLLBACK.md`
- `docs/runbooks/EVIDENCE_STANDARD.md`
- `docs/runbooks/SCHEDULED_HEALTH_CHECKS.md`
- `docs/runbooks/SECRET_ROTATION.md`

## Evidence Policy

- Every incident/update/heal cycle must produce `reason/fix/next`.
- Artifacts must be written under `reports/verification` or `reports/healing`.
- A run is incomplete if evidence artifacts are missing.
