# Debugging Scripts

A guide for the script agent to diagnose a script that fails or behaves
flakily under `run_script` (debug profile). Read this when a debug run logs
`WARN` / `ERROR`, when an operation is unstable, or when a full run can no
longer tell you what state the page is in.

The diagnostic tools available to you, in order of cost:

1. **`console.debug` instrumentation** — cheapest; the log file alone often
   pinpoints the failing stage.
2. **`capturePageState` snapshots** — full HTML before/after an operation, for
   when the log says *where* but not *what* the page became.
3. **Segmented runs** — split the script into small standalone snippets and run
   each one, for when the whole script can't be run or its state is
   unobservable mid-run, with unsolvable infinite loops, timeouts or failures.
4. **Read-only browser tools** — observe the live page directly, independent of
   any script run.

They compose into one loop: log → localize → snapshot → (if still unclear)
segment → cross-check with live observation → fix → full regression.

---

## 1. Instrument with `console.debug`

`console.debug` is a **no-op under the release profile** (the default) and only
emits under the debug profile. That makes it free to leave in production: it
lights up exactly when you debug and stays silent otherwise. Prefer it over
`console.log` for verbose diagnostic detail so the release log stays clean.

Place `console.debug` calls at the points where you would otherwise be
guessing. Each should answer a specific question about *why* this stage might
fail.

### Where to instrument

| Location | What to log | Why |
|---|---|---|
| Stage entry | `'stage: <name> | url=… | title=…'` | Confirms navigation landed before any action |
| After a locator resolves | `'loc: <desc> | count=<n> | visible=<bool>'` (use `await locator.count()` / `await locator.isVisible()`) | Catches "element not found" before it becomes a vague timeout |
| Loop body, each iteration | `'iter i=<i>/<N> | acc=<running total or count>'` | Reveals which iteration diverges; flaky pages often fail on iteration N |
| Before/after `waitForLoadState` / `waitForSelector` | `'wait: <what> | before'` / `'wait: <what> | ok'` | Distinguishes "never settled" from "settled then broke" |
| `try/catch` block | `catch (e) { console.debug('err: ' + e.message + ' | url=' + page.url()); throw e }` | Captures the page URL at failure time, not just the stack |
| Before/after a state-changing action (click/fill/submit) | `'act: <op> | before'` / `'act: <op> | after | url=…'` | Detects silent navigation or redirect right after the action |

### What to put in each line

A good debug line is one line that you can scan down a log file and spot the
divergence. Include the things that, if wrong, would *explain* the failure:

- `url` and `title` — what page are we actually on?
- the key variable or counter for this stage — `i`, accumulated count, a parsed
  value
- a locator's `count()` — does the element exist at all?
- a short label so you can grep the stage: `'stage: login'`, `'act: submit'`

Avoid dumping large objects (full `console.debug(page)` is useless). If you
need the page's full content, that is what `capturePageState` is for — not the
log.

### Example

```typescript
console.debug(`stage: search | url=${page.url()} | title=${await page.title()}`)
const results = page.locator('[data-testid="result-card"]')
console.debug(`loc: result-card | count=${await results.count()}`)
for (let i = 0; i < Math.min(await results.count(), N); i++) {
  console.debug(`iter i=${i}/${N}`)
  try {
    await results.nth(i).click()
    console.debug(`act: click result i=${i} | after | url=${page.url()}`)
  }
  catch (e: any) {
    console.debug(`err: click result i=${i} failed | ${e.message} | url=${page.url()}`)
    throw e
  }
}
```

---

## 2. Capture page state before/after an operation

`console.debug` tells you *where* it failed. `capturePageState` tells you *what
the page was* at that moment — the full HTML. Use them together: the log
localizes the failing stage, the snapshot shows the real DOM that caused it.

`capturePageState` comes from the `@roxybrowser/sandbox/debug` capability
package — no `fs` needed (the script has none). It writes only under the
**debug** profile (a no-op under release, so it's safe to leave in a saved
script). Import it and call it directly:

```typescript
import { capturePageState } from '@roxybrowser/sandbox/debug'
```

Then instrument around a suspect operation:

```typescript
await capturePageState(page, 'before-submit')
await page.getByRole('button', { name: 'Submit' }).click()
await capturePageState(page, 'after-submit')
```

It writes `<workspace>/html-snapshots/<label>.html` (alongside the run log file).
Read the snapshots back with `read_file('html-snapshots/<label>.html')` (relative
path, no `..`). Need to dump a non-HTML artifact (parsed JSON, an intermediate
value)? Use `writeDebugFile('parsed.json', content)` from the same package — same
debug-only semantics, read back with `read_file('html-snapshots/parsed.json')`.

### When to pair snapshots

Pair a **before** and **after** around any operation whose effect you cannot
predict from the log alone:

- **State-changing actions** — submit, login, delete, toggle. Diff before/after
  to see whether the action landed, was blocked by validation, redirected, or
  rendered an error.
- **Flaky operations** — the operation that sometimes works and sometimes
  doesn't. Capture both runs and compare the *before* snapshots: a different
  starting page is the root cause, not the action.
- **Navigation/wait boundaries** — when a `waitForLoadState` returns but you
  suspect the page isn't actually ready. The after-snapshot shows what was
  actually rendered.

### Label convention

Use short, kebab-case, stage-specific labels so `read_file` paths and log lines
stay greppable: `before-submit`, `after-submit`, `after-login`, `page-3-loaded`.
For looped operations, suffix the index: `before-click-i-2`, `after-click-i-2`.

### Diffing

Read both snapshots and compare structurally — don't diff the raw strings by
eye (full HTML is large). Focus on: did the URL change? Did the target element
appear/disappear/change text? Is there now an error banner or dialog that
wasn't before? That delta is the diagnosis.

### Safety

Snapshots of authenticated pages may embed in-page tokens or session data.
Treat them as workspace-local diagnostics — read them, fix the script, then
they are disposable. Never exfiltrate snapshot contents.

---

## 3. Segmented runs — when the whole script can't tell you the state

Two situations call for this:

- **The full run can't be judged.** The script crashes partway, or after some
  stage the page state is unknowable from the log alone, and you can't tell
  whether the failure is in stage 2 or stage 4.
- **The script can't run at all.** The connection fails, or the script errors
  out before any useful state is reached, so a full `run_script` gives you
  nothing to diagnose.

In both cases, stop trying to reason about one giant script. **Split it into
small standalone snippets and run each one in isolation.**

### How to split

Each snippet is itself a **complete sandbox script** — it must still pass
`validate_script`, so it needs the full structure (`export async function main(options?)`,
the `BROWSER_URL`/`CDP_URL` connection block; the sandbox calls `main(options)`
itself — do not add `export const __main = main()`). You are not writing
fragments; you are writing several tiny scripts that each do one stage. A
debug snippet with no real input can be a parameterless `export async function main(): Promise<void>`.

Name them by stage and keep them in the workspace, e.g.:

```
debug-step1-login.ts
debug-step2-search.ts
debug-step3-scrape.ts
```

Each snippet:

1. Connects to the browser (the standard connection block — unchanged).
2. Performs **one** stage's worth of work.
3. Ends with a `capturePageState` and a `console.debug` summary of what it
   achieved, so the run's log + snapshot fully describe the outcome of that
   stage.

Run each with `run_script` (`scriptName: "debug-step1-login.ts"`,
`profile: "debug"`). Because each is independent, a failure in step 3 does not
mask step 1 — you see exactly which stage breaks.

### Important: state does not carry between snippets

Each `run_script` opens a fresh connection to the browser profile, but **page
state from one snippet does not automatically carry to the next** — a new
`run_script` reconnects and may land on a different page. So a snippet must
either:

- re-navigate to where the previous stage left off (include the `page.goto` /
  navigation that gets it there), **or**
- assume the page is already in the expected state (e.g. you ran step 1
  manually just before, and the browser profile still shows the logged-in
  page).

This is why each snippet should `capturePageState` at its **start** too: it
records the page state it inherited, so you can tell whether the snippet failed
because of its own logic or because it started on the wrong page.

### Cross-check with live browser tools

After (or instead of) running a snippet, use the read-only browser tools
(below) to observe the live page directly. They don't depend on a script run,
so they work even when `run_script` itself can't execute. This is how you
diagnose the "script can't run at all" case: connect, observe, and reason about
the current page without needing a successful run.

### Resolve and fold back

Once a stage's failure is located and fixed in its snippet, **fold the fix back
into `script.ts`**, delete the temporary `debug-step*.ts` snippets, and
run the full `script.ts` once more in debug to confirm the integrated
script now passes end to end. The snippets are scaffolding — the deliverable is
always the single `script.ts`.

---

## 4. Read-only browser tools

These MCP tools observe the live page without mutating it. They are the only
browser tools available to the script agent, and they work **independent of any
`run_script`** — useful both before a run (to see the starting state) and after
a failed run (to see what state the script left the page in).

| Tool | What it shows | When to use |
|---|---|---|
| `browser_snapshot` | Accessibility tree of the current page | The primary tool — see what elements exist and their names/roles, like the agent does during the source task |
| `browser_take_screenshot` | A rendered image of the viewport | When the a11y tree doesn't capture visual state (overlays, canvas, layout issues) |
| `browser_console_messages` | Page's JS console output | Catch client-side errors the script triggered (e.g. a React error boundary, a 401 logged by the SPA) |
| `browser_network_requests` | Network requests/responses | See if an XHR/fetch the script triggered returned an error or unexpected payload |
| `browser_tab_list` | Open tabs/windows | Confirm which tab the script is actually operating on (scripts that open popups can land on the wrong tab) |
| `browser_wait_for` | Wait for a condition on the live page | Probe whether an element/text will appear given the current state, without running a script |
| `browser_evaluate` | The exact value of an element or the page (text, attribute, computed style, `localStorage`/`sessionStorage`, a selector's match count) | When `browser_snapshot`/`browser_take_screenshot` confirm an element exists but not its precise value — e.g. did an input end up with the right final value, did a flag get set |

These tools connect to the browser profile the script agent opened for the
operation-log session. Use them to:

- **Before a run** — check the starting page state, so you know whether a
  failure is the script's fault or a bad starting point.
- **After a failed run** — see what state the script left the page in, which
  often explains the failure more directly than the log.
- **Instead of a run** — when `run_script` can't execute at all, these are your
  only window into the page.

They are strictly read-only. Never use them to click, type, navigate, or
complete the task — only the script does that. Mutation must go through
`run_script`.

### `browser_evaluate` is the one exception that needs a rule

The other five tools are read-only by construction — there's no argument you
can pass `browser_snapshot` that makes it click something. `browser_evaluate`
is different: it runs an arbitrary JS expression, so nothing at the tool level
stops it from calling `.click()` or assigning `.value = ...`. That boundary is
on you, not the tool.

Only pass expressions that **read and return a value** — never one with a side
effect:

```typescript
// OK — reads a value, no side effect
() => document.querySelector('input[name="email"]')?.value
() => localStorage.getItem('feature_flag_x')
() => document.querySelectorAll('.result-card').length

// NOT OK — mutates the page; this belongs in the script, not here
() => document.querySelector('button.submit')?.click()
() => { document.querySelector('input').value = 'x' }
```

Two concrete uses during script debugging:

- **Confirm a script's write landed correctly** — after `run_script`, evaluate
  the exact final value of a field the script filled in (`.value`,
  `textContent`) instead of guessing from the a11y tree, which shows the
  control exists but not what it currently holds.
- **Check a flag or counter the script is supposed to set** — read a
  `localStorage`/`sessionStorage` key, or count elements matching a selector,
  to verify the script's effect without re-running it.

If you find yourself wanting to write a mutating expression, that's a sign the
check belongs inside the candidate script (paired with a `capturePageState`
snapshot around it), not in `browser_evaluate`.

---

## 5. The debug loop

Bring the tools together into one workflow:

1. **Run the full `script.ts` in debug.** Read the returned log file
   (relative path in the workspace).
2. **Scan the `console.debug` trail.** The last good stage and the first failed
   one localize the problem. If a `try/catch` logged `err: … | url=…`, you have
   the failure point and the page URL at failure.
3. **If the log localizes but doesn't explain** — read the
   `html-snapshots/<label>.html` around that stage. The before/after diff shows
   what the page actually did. If no snapshot exists there yet, add
   `capturePageState` before/after the suspect operation and rerun.
4. **If the full run can't be judged or can't run at all** — split into
   `debug-step*.ts` snippets (each a complete sandbox script), run them one
   stage at a time, and `capturePageState` at each snippet's start and end.
   Cross-check with the read-only browser tools between snippets.
5. **Fix.** Apply the fix in the snippet (or directly in `script.ts`
   if the diagnosis was clear).
6. **Fold back and regress.** Merge any snippet fix into `script.ts`,
   delete the `debug-step*.ts` snippets, and run the full
   `script.ts` once more in debug to confirm the end-to-end pass.
   Only then proceed to `save_script`.

The loop narrows the failure at each step: the whole script → a stage → a
before/after page diff → a single isolated operation. Stop as soon as the cause
is clear — don't segment if a snapshot already explains it, and don't snapshot
if the log already does.
