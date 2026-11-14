# fb-05 — Network monitor (graphql) + JSON extract → CSV with login early-exit

**Pattern**: 网络监听(`page.on('response')`)+ JSON 抽取 → `Table` 持久化,带登录态早退
**Capability clusters**: C6 (数据采集 + 持久化) + C7 (状态早退) + C15 (网络监听)
**User intent keywords**: "监听 graphql" / "page.on response" / "网络监听" / "account_user" / "导出 CSV/Excel" / "登录态早退" / "Logout 关闭浏览器"

## Distinctive techniques

- **`page.on('response', ...)` registered BEFORE the navigation that triggers it**. Order matters — registering after `goto()` misses early responses.

- **Stream-aware payload parsing**: FB graphql sometimes concatenates multiple JSON objects per response separated by newlines; split on `/\n/` and `JSON.parse` each part defensively (skip non-JSON parts).

- **Two-phase polling**: 50 × 50ms quick poll first (handles fast cache hits), then extend to 30 × 1s longer waits (network-bound). Avoids burning CPU on fast path while still tolerating slow responses. Poll intervals use `sleep` with equal bounds on purpose — a fixed cadence keeps the 2.5s / 30s budget honest.

- **Login form detection ≡ "logged out" signal**: `[action^="/login"]` is the FB-canonical login form. Its presence on the homepage means session is invalid → log "Logout" + close + return (early exit pattern).

- **Defensive JSON path traversal**: every property access does `?? undefined` cast through `Record<string, unknown>` then `String(... ?? '')` for the row. Wrapped in try/catch that reports the failure via `console` (the run log is the primary diagnostic signal — SKILL.md §5); the verbose raw-payload dump goes to `console.debug`, which is silent under release and only emits under the debug profile. For a visual snapshot, run under the **debug** profile with `capturePageState` (see `references/debugging.md`); 

- **Persist through `Table`, not raw `fs`**: `new Table('accountQuality')` + `append(row)` writes a CSV whose header is derived from the record keys, with escaping handled by the capability package — no hand-rolled `csvEscape`. The script has no `fs` at all (`import fs` throws `Module not allowed`), so the older `fs.writeFileSync` approach is impossible; `Table` is the way to persist row data. (`KV` is its sibling for genuine cross-run *state* — e.g. per-account `lastRun` timestamps — not a place to stash logs or failure dumps; those belong in `console`.) See SKILL.md §3, `references/sandbox-api.d.ts`.

## Canonical implementation

```typescript
// Task: goto FB → detect login form → if present, log 'Logout' and early-exit
//       → page.on('response') listens on api/graphql → goto accountquality
//       → poll up to 50× until a response carries account_user → extract 6 fields
//       → append to Table; on failure, report via console
// Persistence: extracted row → Table('accountQuality') (CSV, release-safe).
//              Logs / diagnostics → console (console.debug emits only under the debug profile);
//              KV is for useful cross-run data only, never logs.
// Runtime: roxy-agent sandbox injects BROWSER_URL/CDP_URL/BROWSER_TYPE.

import { chromium, firefox } from 'playwright'
import { sleep } from '@roxybrowser/sandbox/utils'
import { Table } from '@roxybrowser/sandbox/table'

const BROWSER_URL = process.env.BROWSER_URL ?? ''
const CDP_URL = process.env.CDP_URL ?? ''
const BROWSER_TYPE = process.env.BROWSER_TYPE ?? 'chromium'

interface AccountRow {
  accountUserId: string
  accountUserName: string
  isRestricted: string
  adBusinessesId: string
  adBusinessesName: string
  adBusinessesIsRestricted: string
}

function findFirstAccountUser(payloads: unknown[]): unknown {
  for (const p of payloads) {
    if (!p || typeof p !== 'object')
      continue
    const data = (p as Record<string, unknown>).data as Record<string, unknown> | undefined
    const viewer = data?.viewer as Record<string, unknown> | undefined
    if (viewer && viewer.account_user)
      return p
  }
  return null
}

export async function main(): Promise<void> {
  const browser = BROWSER_URL
    ? (BROWSER_TYPE === 'firefox' ? await firefox.connect(BROWSER_URL) : await chromium.connect(BROWSER_URL))
    : await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0] ?? await browser.newContext()
  const page = context.pages()[0] ?? await context.newPage()
  console.log('[start]')

  await page.goto('https://www.facebook.com/', { timeout: 30000 })
  await sleep(4000, 6000)

  // Login detection — early exit
  const loginForm = page.locator('[action^="/login"]').first()
  if (await loginForm.count() > 0) {
    console.log('Logout: login form detected at FB homepage')
    console.error('[logged_out]')
    await browser.close()
    return
  }

  // Network listener — collect graphql responses (register BEFORE the goto that fires them)
  const responsePayloads: unknown[] = []
  page.on('response', async (resp) => {
    if (!resp.url().includes('api/graphql'))
      return
    try {
      const text = await resp.text()
      // FB graphql streams concatenate multiple JSONs separated by newlines sometimes
      const parts = text.split(/\n/).map(s => s.trim()).filter(Boolean)
      for (const part of parts) {
        try {
          responsePayloads.push(JSON.parse(part))
        }
        catch { /* not JSON */ }
      }
    }
    catch { /* ignore */ }
  })

  await page.goto('https://www.facebook.com/accountquality/?landing_page=overview', { timeout: 30000 })

  // Poll up to 50 iterations × 50ms = 2.5s, then extend to ~30s with longer waits.
  // Equal-bound sleep is intentional: a fixed cadence keeps the time budget exact.
  let target: unknown = null
  for (let i = 0; i < 50; i++) {
    target = findFirstAccountUser(responsePayloads)
    if (target)
      break
    await sleep(50, 50)
  }
  if (!target) {
    console.log('Initial 2.5s poll did not find account_user, extending to 30s')
    for (let i = 0; i < 30; i++) {
      target = findFirstAccountUser(responsePayloads)
      if (target)
        break
      await sleep(1000, 1000)
    }
  }

  if (!target) {
    console.log(`Did not capture account_user in graphql responses (collected ${responsePayloads.length} payloads)`)
    console.debug(`raw payloads: ${JSON.stringify(responsePayloads)}`)
    await browser.close()
    return
  }

  // Extract fields with safe accessors
  try {
    const data = (target as Record<string, unknown>).data as Record<string, unknown>
    const viewer = data.viewer as Record<string, unknown>
    const accountUser = viewer.account_user as Record<string, unknown>
    const accountUserId = String(accountUser.id ?? '')
    const accountUserName = String(accountUser.name ?? '')
    const restrictionInfo = accountUser.advertising_restriction_info as Record<string, unknown> | undefined
    const isRestricted = String(restrictionInfo?.is_restricted ?? '')

    const adBusinesses = viewer.ad_businesses as Record<string, unknown> | undefined
    const nodes = adBusinesses?.nodes as unknown[] | undefined
    const node0 = (nodes && nodes[0]) as Record<string, unknown> | undefined
    const adBusinessesId = String(node0?.id ?? '')
    const adBusinessesName = String(node0?.name ?? '')
    const adBusinessesAr = node0?.advertising_restriction_info as Record<string, unknown> | undefined
    const adBusinessesIsRestricted = String(adBusinessesAr?.is_restricted ?? '')

    const row: AccountRow = {
      accountUserId,
      accountUserName,
      isRestricted,
      adBusinessesId,
      adBusinessesName,
      adBusinessesIsRestricted,
    }
    // Table derives the CSV header from the record keys and handles escaping itself.
    const table = new Table('accountQuality')
    await table.append(row)
    console.log(`Row appended to Table('accountQuality'): ${accountUserId} / ${accountUserName}`)
  }
  catch (err) {
    console.error(`Field extraction failed: ${(err as Error).message}`)
    console.debug(`raw target payload: ${JSON.stringify(target)}`)
  }

  console.log('[closing_browser]')
  await browser.close()
}

```
