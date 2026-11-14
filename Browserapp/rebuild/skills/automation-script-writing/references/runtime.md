# Runtime Environment (deep reference)

The script runs inside a `vm.SourceTextModule` sandbox — a curated subset of
Node, not the real thing. SKILL.md §3 has the red lines; this file is the full
detail. It is the single source of truth for what exists at runtime.

## Injected globals (no import)

- **`console`** — standard API, routed to the host. `console.debug` is a **no-op
  under the release profile** (default); it emits only under `debug`.
- **`process`** — a curated subset (see below).
- **Timers** — `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`.
- **Built-ins** — `Buffer`, `URL`, `URLSearchParams`, `TextEncoder`,
  `TextDecoder`, `Error`/`TypeError`/`RangeError`, `Promise`, `JSON`, `Math`,
  `Date`, `parseInt`, `parseFloat`, `isNaN`, `isFinite`, the `encode*/decode*`
  URI fns, `Object`, `Array`, `Map`, `Set`, `WeakMap`, `WeakSet`, `Symbol`,
  `RegExp`, the typed arrays, `ArrayBuffer`, `SharedArrayBuffer`, `DataView`.
- **Disabled**: `fetch` and `XMLHttpRequest` are `undefined` (also validator-blocked).

## `process` subset

- `cwd()` → the **real per-run workspace directory** (not `/`, not the agent's
  workspace). Base for relative paths.
- `exit(code)` → safe: flushes collected artifacts, then exits.
- `env` → only the whitelisted keys (below); reading anything else is a
  validation error.
- Safe passthrough: `platform`, `arch`, `version(s)`, `pid`, `ppid`, `argv0`,
  `stdout`/`stderr`/`stdin`, `nextTick`, `hrtime`, `memoryUsage`, `cpuUsage`,
  `uptime`, `emitWarning`, and the signal/event API (`on`/`once`/`off`/…).
- Scrubbed: `argv === ['node','sandbox','<script>']`, `execPath === 'node'`,
  `execArgv === []`.
- Neutralized no-ops (do not rely on): `binding`/`dlopen`/`_rawDebug` → undefined,
  `send` → false, `kill` → true (no signal), `disconnect`/`chdir` → no-op,
  `mainModule`/`channel` etc. → undefined/null. Unknown props → undefined.

## Environment variables (whitelist)

| Key | Meaning |
|-----|---------|
| `BROWSER_URL` | preferred WS endpoint (chromium & firefox via `.connect()`) |
| `BROWSER_TYPE` | `'chromium'` (default) or `'firefox'` |
| `CDP_URL` | legacy CDP endpoint, fallback when `BROWSER_URL` unset (chromium only) |
| `SANDBOX_RUN_ID` | unique run id |
| `SANDBOX_DIR_ID` | operation-log session dir id |

There is no `SANDBOX_OUTPUT_DIR` for scripts — use `process.cwd()`. Reading any
non-whitelisted key (or bare `process.env`) triggers the `process-env` rule.

## Imports (whitelist — runtime-enforced)

Allowed: `playwright`; `path`, `url`, `crypto`, `buffer`,
`stream` (each also as `node:` form); and the capability packages
`@roxybrowser/sandbox/{utils,human,llm,table,kv,debug}` (signatures in
`sandbox-api.d.ts`). Any other specifier throws `Module not allowed` at runtime.

Blocked (also `forbidden-api` for the bare identifiers): `fs`, `fs/promises`,
`child_process`, `worker_threads`, `net`, `http`, `https`, `os`, `vm`, `dgram`.
The import whitelist is enforced by the module linker, **not** the static validator.

## Filesystem — none

The script has **no filesystem access**: `import fs` / `import fs/promises` throw
`Module not allowed`. Persist run data via `@roxybrowser/sandbox/table` (CSV rows)
or `@roxybrowser/sandbox/kv` (JSON key-value). Write debugging snapshots / files
via `@roxybrowser/sandbox/debug` (`capturePageState` / `writeDebugFile`) — these
write only under the debug profile and are no-ops under release. All three do
their real fs work on the host side, outside the sandbox.

## Validator rules (error level → script rejected)

| Rule | Catches |
|------|---------|
| `syntax` | TS/syntax errors |
| `failed-marker` | `// FAILED:` comments |
| `network-call` | `fetch()` / `new XMLHttpRequest()` |
| `process-env` | env key outside whitelist, or bare `process.env` |
| `forbidden-api` | bare `child_process` / `worker_threads` |
| `legacy-browser-global` | old MCP globals (`browser_navigate`, …) |
| `unsupported-runtime-global` | `log.info` / `trace.` / `files.` / `runtime.` / `report(` |
| `empty-locator` | `locator('')`, `getByRole('')`, … |
| `unstable-ref` | `aria-ref=e12` or `UNSTABLE: AXTree ref` |
| `sensitive-leak` | hardcoded tokens / api keys / cookies |
| `structure-main` | missing exported `async function main(` / `const main = async` |
| `structure-connect` | missing `connectOverCDP(` / `.connect(` |
| `structure-cdp-url` | missing `process.env.BROWSER_URL` / `CDP_URL` |
