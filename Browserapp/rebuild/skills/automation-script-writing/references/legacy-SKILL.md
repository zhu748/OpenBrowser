---
name: automation-script-writing
description: Write, validate, run, debug, and save reusable Playwright automation scripts from recorded RoxyBrowser browser operations. Covers the script skeleton contract, the options/JSON-Schema input rules, the sandbox execution environment (injected globals, env/import whitelists, the @roxybrowser/sandbox capability packages), run outputs (artifacts, logs, profiles), and the authoring workflow over the draft workspace files.
---

# Automation Script Writing

Turn a recorded browser-operation session into one reusable Playwright script.
The script runs inside a strict VM sandbox and is driven by the tools
`draft_script` → `validate_script` → `run_script` → `save_script`. The sandbox enforces a strict contract on the script skeleton, the input `options` (typed with a JSON Schema), and the runtime environment (injected globals, fs/env/import whitelists, the @roxybrowser/sandbox capability packages). The script produces run outputs (artifacts, logs, profiles) that you read back to judge a run.

Read this whole file first — it carries the rules you must not violate. 

---

## 1. Authoring workflow

1. **Draft.** Probe with `read_file("seed_script.ts")`. If it has content the
   draft already exists — skip `draft_script`. Otherwise call `draft_script`
   once to initialize the workspace. Never `ls`/`glob`/`find` for it.
2. **Read the inputs.** `read_file` the workspace files (§7) to learn user
   intent, the recorded operations, and the DOM context for locators.
3. **Write** `script.ts` and author `script_schema.json` (§2) with `write_file`.
4. **Validate** with `validate_script("script.ts")` — fix every error (§3).
5. **Run** with `run_script` (profile `debug` while iterating) passing a real
   `options` built from the schema. Read the returned log.
6. **Debug** if it fails — see `references/debugging.md`. Repeat ≤ 3×.
7. **Save** only when the user asks: `save_script` with `path:"script.ts"` and
   the same `optionsSchema` as `script_schema.json`.

> Skill-bundled files (this file, `references/*`) are read with `load_skill_file`,
> **not** `read_file`. Workspace files (`script.ts`, `html-snapshots/*`) use
> `read_file`.

---

## 2. Script structure (the contract)

```typescript
import { chromium, firefox } from 'playwright'
import { sleep } from '@roxybrowser/sandbox/utils'   // prefer built-ins over hand-rolling

const BROWSER_URL = process.env.BROWSER_URL ?? ''
const BROWSER_TYPE = process.env.BROWSER_TYPE ?? 'chromium'

export async function main(options: ScriptOptions): Promise<void> {
  const browser = BROWSER_TYPE === 'firefox' ? await firefox.connect(BROWSER_URL) : await chromium.connect(BROWSER_URL)
  const context = browser.contexts()[0] ?? await browser.newContext()
  const page = context.pages()[0] ?? await context.newPage()

  // … business logic; read runtime values from `options` …
  
  await browser.close()
}
```

Hard rules (validator enforces the ⚠️ ones):
- ⚠️ Export an async `main` — `export async function main(` or `export const main = async`.
- ⚠️ Connect via `connect`, reading `process.env.BROWSER_URL`.
- The sandbox calls `main(options)` itself — **don't** call `main()` yourself or write `export const __main = …`.
- `process.exit(code)` is allowed (flushes artifacts first); use it for the endpoint guard or a fatal bad-input, not on the happy path.
- **Stabilize recorded locators**: replace every `aria-ref=`, `REPLACE_ME`,
  `UNSTABLE`, `// FAILED:` marker with a stable locator (priority:
  `data-testid`/`aria-label` exact → role+name → scoped visible text → stable CSS).

---

## 3. Runtime environment (red lines)

The script runs in a VM sandbox — **not** normal Node. Full detail in
`references/runtime.md`; the non-negotiables:

- **No network primitives.** `fetch` / `XMLHttpRequest` are `undefined` (and
  validator-blocked). Get web data by driving the page with Playwright. To
  **download a resource** (image/file), fetch it through the browser and save via
  Playwright — see `references/downloading-resources.md`.
- **No filesystem.** `import fs` throws `Module not allowed`. Persist via
  `@roxybrowser/sandbox/table` / `kv`; write debug snapshots / files via
  `@roxybrowser/sandbox/debug`.
- **Imports are whitelisted** (runtime-enforced): `playwright`, `path`,
`url`, `crypto`, `buffer`, `stream` (+ `node:` forms), and the
  `@roxybrowser/sandbox/*` packages below. Anything else throws `Module not allowed`.
- **`process.env` is limited** to `BROWSER_URL`, `BROWSER_TYPE`,
  `SANDBOX_RUN_ID`, `SANDBOX_DIR_ID`. Any other key is a validation error.
  `process.cwd()` is the real per-run workspace dir.

### Built-in capability packages — prefer these over hand-rolling

Full signatures in `references/sandbox-api.d.ts` .

| Import | Tier | Gives you |
|--------|------|-----------|
| `@roxybrowser/sandbox/utils` | pure | `sleep`, `randomBetween`, `pick`, `maybe`, `chunk`, `retry` |
| `@roxybrowser/sandbox/human` | pure | `humanScroll`, `humanType` (on a Playwright `Page`) |
| `@roxybrowser/sandbox/llm`   | host | `ask` (text), `json` (structured via JSON Schema) |
| `@roxybrowser/sandbox/table` | host | `Table` — CSV row store: `append`/`all`/`find`/`clear` |
| `@roxybrowser/sandbox/kv`    | host | `KV` — JSON key-value: `get`/`set`/`has`/`delete`/… |
| `@roxybrowser/sandbox/debug` | host | `capturePageState`, `writeDebugFile` — debug-profile snapshots (no-op under release) |

pure = free/deterministic; host = runs through the host (llm may be slow/billed,
table/kv persist to disk, debug writes only under the debug profile).

---

## 4. Script input (`options`)

Every runtime-supplied value goes through the single `options` argument on
`main` — never hard-code them, never read them from `process.env`.

- **Model input as `options`.** Identify per-run values (urls, counts, captions,
  ranges…) and put them on `options`, typed with an `interface`.
- **`options` vs `config`.** `options` = caller input per run; a top-level
  `config` = stable constants derived from the operation log.
- **Author `script_schema.json`.** Write the matching JSON Schema (object +
  properties + required + descriptions) with `write_file`. Required even for
  no-input scripts (`{}`).
- **Test with a real `options`** built from that schema when you `run_script`.
- **Save with the same schema** as `save_script`'s `optionsSchema` argument (you
  must pass it explicitly; `{}` for no-input scripts).
- A no-input script may drop the parameter: `export async function main(): Promise<void>`.

---

## 5. Run outputs

- **Artifacts.** Files written into the run workspace (via `table`/`kv`) are
  collected and returned as downloadable artifacts.
- **Log file.** `run_script` returns a log path (workspace-relative). Read it to
  judge a run — it's your primary signal, since the page is invisible afterward.
- **Profiles.** `release` (default): clean logs; `console.debug` and
  `@roxybrowser/sandbox/debug` are no-ops. `debug`: `console.debug` emits and
  `@roxybrowser/sandbox/debug` writes snapshots.
- **`html-snapshots/`.** Full-page HTML captured during debugging via
  `@roxybrowser/sandbox/debug`; read back with `read_file`. See `references/debugging.md`.

---

## 6. Console / output

Use the standard `console` API — the sandbox routes it to the host. Only quirk:
`console.debug` is a **no-op under release**; use it for verbose diagnostics,
`console.log`/`info` for output you always want.

**Observability vs. persistence — never confuse them.** `console` is your only
observability channel: it lands in the run log, and the run log is the *only*
thing you read back to judge a run (§5, §7). `Table`/`KV` are durable **data**
outputs — you write them for the deliverable or cross-run state, and you do
**not** read them back to diagnose a run. So:

- Logs, progress, and failure diagnostics → `console` (verbose → `console.debug`).
  **Never route a log or a failure dump into `KV`/`Table`** — nothing reads it
  there; it's invisible to you and pollutes durable state.
- Results and cross-run state → `Table` (rows) / `KV` (state). **Never dump these
  into the log** as your storage — the log is not a store, it's not read back as data.

Litmus test before a `KV.set` / `Table.append`: *"will something read this value
later for its own sake?"* If it's only there so you can see what happened, that's
a `console` line, not persistence.

---

## 7. Workspace files (authoring inputs)

Prepared by `draft_script`, at the workspace root. Read with `read_file`.

| File | What it is | Editable |
|------|-----------|----------|
| `script.ts` | the editable script draft you produce | ✅ you write it |
| `script_schema.json` | the `options` JSON Schema you author (single source of truth) | ✅ you write it |
| `seed_script.ts` | deterministic seed from observed operations — the skeleton to stabilize | read-only input |
| `operation_summary.md` | browser-operation facts + DOM context for locators | read-only input |
| `conversation.jsonl` | conversation context (user intent) | read-only input |
| `browser-ops.jsonl` | raw browser operation events | read-only input |

Do not judge script success by reading artifacts here — the run happens in an
isolated dir; use the run log. Only exception: `html-snapshots/*.html`.

---

## 8. When to go deeper (`references/`)

| Read | When |
|------|------|
| `references/sandbox-api.d.ts` | you need exact signatures of the `@roxybrowser/sandbox/*` packages |
| `references/runtime.md` | you need the full globals/process/fs/env/import + validator-rule detail |
| `references/control-flow.md` | loops / conditionals / wait ranges / human-simulation patterns |
| `references/debugging.md` | a run fails/flakes: instrumentation, snapshots, segmented runs, live browser tools |
| `references/downloading-resources.md` | you need to download an image/file/resource and save it as a run artifact |
| `examples/` | you want a full worked script close to the user's intent |