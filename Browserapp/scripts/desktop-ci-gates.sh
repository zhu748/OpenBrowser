#!/usr/bin/env bash
set -e

gate() {
  local label=$1 status
  shift
  printf '[desktop gate] START %s\n' "$label"
  if "$@"; then
    printf '[desktop gate] PASS %s\n' "$label"
  else
    status=$?
    printf '[desktop gate] FAIL %s (exit %s)\n' "$label" "$status" >&2
    # Keep public annotations to the static label and numeric exit status.
    printf '::%s::Desktop gate failed: %s (exit %d)\n' "$severity" "$label" "$status"
    # gates runs in a subshell. The outer if disables its errexit, so
    # explicitly end this attempt rather than returning to the next test.
    exit "$status"
  fi
}

gates() (
  severity=$1
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
)

first_failure_severity=error
if [[ "$RUNNER_OS" == "macOS" ]]; then first_failure_severity=warning; fi
if gates "$first_failure_severity"; then
  exit 0
else
  status=$?
fi
if [[ "$RUNNER_OS" != "macOS" ]]; then exit "$status"; fi
echo '::warning::desktop gates failed on macOS; retrying once'
gates error
