# Agent Drive Model

## Baseline

- Execution model: `only-agent-driven`
- AI posture: `ai-native` and `ai-responsive`
- Supported agents: Codex, Gemini, Claude

## Contracts

1. Agent contract file:

- `config/asanmod-universal/agent-contract.json`

2. Architecture map:

- `config/asanmod-universal/architecture-map.json`

3. Docs dependency graph:

- `config/asanmod-universal/docs-graph.json`

4. Docs template lock:

- `config/asanmod-universal/doc-templates.json`

5. Install/runtime lock:

- `.asanmod/install.lock.json`

6. Profile state:

- `.asanmod/state/profile-state.json`

7. Verification evidence:

- `reports/verification/*.json`
- `reports/verification/*.md`

8. Self-healing evidence:

- `reports/healing/*.json`
- `reports/healing/*.md`

## Required Flow

1. `npm run agent:init`
2. `npm run mode:status`
3. `npm run verify`
4. `npm run self-heal -- --apply` (when deterministic recovery is required)

## Failure Output Format

- `reason`
- `fix`
- `next`
