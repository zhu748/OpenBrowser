#!/usr/bin/env bash
set -e

retry_available=false
if [[ "$RUNNER_OS" == "macOS" ]]; then retry_available=true; fi

gate() {
  local label=$1 status
  shift
  printf '[desktop gate] START %s\n' "$label"
  if "$@"; then
    printf '[desktop gate] PASS %s\n' "$label"
    return
  else
    status=$?
  fi
  # Consume the suite's one retry on the failing gate. Completed tests own
  # separate fixture directories and do not need to be replayed.
  if [[ "$retry_available" == true ]]; then
    retry_available=false
    printf '::warning::Desktop gate failed: %s (exit %d)\n' "$label" "$status"
    printf '[desktop gate] RETRY %s\n' "$label"
    if "$@"; then
      printf '[desktop gate] PASS %s\n' "$label"
      return
    else
      status=$?
    fi
  fi
  printf '[desktop gate] FAIL %s (exit %d)\n' "$label" "$status" >&2
  printf '::error::Desktop gate failed: %s (exit %d)\n' "$label" "$status"
  return "$status"
}

if [[ "$RUNNER_OS" == "Linux" ]]; then
  gate 'Real render benchmark' xvfb-run -a node node_modules/electron/cli.js --no-sandbox scripts/benchmark-real-render.js --sizes 10,100,1000 --skip-kernel --render-budget-ms 50 --json
  gate 'Desktop startup' xvfb-run -a node automation/selftests/app-startup-e2e-selftest.js
else
  gate 'Real render benchmark' node node_modules/electron/cli.js scripts/benchmark-real-render.js --sizes 10,100,1000 --skip-kernel --render-budget-ms 50 --json
fi
gate 'Editor and performance regressions' node rebuild/optimization-ui-selftest.cjs
gate 'Maintenance' node rebuild/maintenance-ui-selftest.cjs
gate 'Templates' node rebuild/templates-ui-selftest.cjs
gate 'Source workbench' node rebuild/source-workbench-ui-selftest.cjs
gate 'Workbench interactions' node rebuild/workbench-interactions-ui-selftest.cjs
if [[ "$RUNNER_OS" == "Linux" ]]; then
  gate 'Local API UI' node rebuild/local-api-ui-selftest.cjs
  gate 'Packaging' node rebuild/packaging-selftest.cjs
fi
gate 'Agent tasks UI' node rebuild/agent-tasks-ui-selftest.cjs
gate 'Agent history UI' node rebuild/agent-history-ui-selftest.cjs
gate 'Agent streaming UI' node rebuild/agent-streaming-ui-selftest.cjs
gate 'Agent conversation cache UI' node rebuild/agent-conversation-cache-ui-selftest.cjs
gate 'Agent MCP UI' node rebuild/agent-mcp-ui-selftest.cjs
gate 'Agent approval UI' node rebuild/agent-approval-ui-selftest.cjs
