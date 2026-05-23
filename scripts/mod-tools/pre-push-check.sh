#!/bin/bash
set -euo pipefail

echo "[ASANMOD][HOOK][STEP] fast-forward safety check"
while read -r local_ref local_sha remote_ref remote_sha; do
  [ -z "${local_ref:-}" ] && continue
  [ "$local_sha" = "0000000000000000000000000000000000000000" ] && continue
  [ "$remote_sha" = "0000000000000000000000000000000000000000" ] && continue

  if ! git merge-base --is-ancestor "$remote_sha" "$local_sha"; then
    echo "[ASANMOD][HOOK][FAIL] pre-push"
    echo "reason: non-fast-forward push detected (history rewrite risk)"
    echo "fix: sync your branch with remote and preserve linear history"
    echo "next: run safe flow and retry push"
    exit 1
  fi
done

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" == "main" || "$current_branch" == "prod" || "$current_branch" == "production" ]]; then
  echo "[ASANMOD][HOOK][FAIL] pre-push"
  echo "reason: direct push to protected branch '$current_branch' is forbidden"
  echo "fix: push to feature branch and merge via controlled flow"
  echo "next: create/switch feature branch, push, then merge safely"
  exit 1
fi

run_gate() {
  cmd="$1"
  fix="$2"
  echo "[ASANMOD][STEP] $cmd"
  if ! bash -lc "$cmd"; then
    echo "[ASANMOD][HOOK][FAIL] pre-push"
    echo "reason: upstream gate failed -> $cmd"
    echo "fix: $fix"
    echo "next: remediate and rerun push"
    exit 1
  fi
  echo "[ASANMOD][PASS] $cmd"
}

run_gate "npm run docs:sync:check" "Run npm run docs:sync then commit generated mirror updates"

if rg -n "\[PROJECT_NAME\]|\[PROJECT_DESCRIPTION\]|\[WIZARD_WILL_FILL\]" README.md package.json src/app/page.tsx docs/asanmod-core.json >/dev/null 2>&1; then
  echo "[ASANMOD][MODE] template-maintenance"
  echo "[ASANMOD][NEXT] Placeholder-aware upstream gates enabled"
  run_gate "npm run version:lock:check" "Run npm run version:sync && npm run version:lock:check"
  run_gate "npm run structure:check" "Align files with architecture-map contract"
  run_gate "npm run docs:template:check" "Fill required doc headings"
  run_gate "npm run docs:impact:check" "Update related files from docs-graph contract"
  run_gate "npm run runbook:check" "Create/update required runbook docs and headings"
  run_gate "npm run secret:scan:check" "Remove hardcoded secrets and use .env (untracked) placeholders"
  run_gate "npm run migration:name:check" "Rename new drizzle migrations to descriptive snake_case"
  run_gate "npm run expert:reports:policy:check" "Provide required expert reports when strict profile is active"
  run_gate "npm run schema:check" "Repair DB schema export contract"
  run_gate "npm run api:check" "Repair API contract export/wiring"
  run_gate "npm run perf:check" "Apply client performance guardrails"
  run_gate "npm run modular:check" "Split oversized frontend/backend files into modules"
  run_gate "npm run ui:check" "Repair UI pack path/variable contract"
  run_gate "npm run format:check" "Run npm run format:write and commit formatting updates"
  run_gate "npm run lint -- --no-cache --quiet" "Fix lint issues and rerun npm run lint -- --no-cache --quiet"
  run_gate "npm run type-check" "Fix TS issues and rerun npm run type-check"
else
  run_gate "npm run verify:code-change" "Run npm run verify:code-change and fix failing gates"
fi

echo "[ASANMOD][HOOK][PASS] pre-push"
