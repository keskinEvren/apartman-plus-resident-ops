# Universal ASANMOD Boilerplate - Execution Plan

## Goal

Create a universal, agent-first boilerplate that works with Codex/Gemini/Claude across macOS/Linux/Windows and supports three operational modes:

- rapid (MVP speed)
- standard (balanced)
- strict (production-sensitive)

Execution baseline is `only-agent-driven` with `ai-native` and `ai-responsive` constraints.

## Scope Delivered in This Iteration

1. Universal profile/gate model
2. Agent-first install/init lock
3. Environment baseline reporting
4. Product intake doc generation from question pack
5. Mode manager with gate overrides
6. Universal verify runner with evidence artifacts
7. Architecture map enforcement (zone + extension policy)
8. Documentation template lock and impact graph checks
9. Canonical->mirror docs sync contract
10. Deterministic self-healing protocol

## Core Contracts

1. First run lock: `.asanmod/install.lock.json`
2. Active profile state: `.asanmod/state/profile-state.json`
3. Agent contract: `config/asanmod-universal/agent-contract.json`
4. Environment artifacts:

- `reports/environment-baseline.json`
- `reports/environment-baseline.md`

4. Product clarity artifacts:

- `docs/PRODUCT_BRIEF.md`
- `docs/EXECUTION_PLAN.md`
- `docs/QUESTIONNAIRE_ANSWERS.md`
- `docs/AGENT_DRIVE_PROTOCOL.md`

## Gate Modes

1. rapid

- install_lock
- agent_contract
- environment_report
- product_docs
- no_placeholders
- structure_check
- docs_template_check
- docs_impact_check

2. standard

- rapid + lint + type_check

3. strict

- standard + docs_sync_check + test + build

## Usage Flow

1. `npm run agent:init`
2. `npm run mode:status`
3. `npm run mode:set -- standard`
4. `npm run verify`

## Notes

- Legacy verifier is kept as `verify:legacy`.
- This iteration is native-first (PM2/local runtime). Docker is optional and intentionally excluded from required flow.
