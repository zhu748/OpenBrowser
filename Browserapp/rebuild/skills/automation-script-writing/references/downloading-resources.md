# Downloading Resources (images / files)

The sandbox blocks the **script's** own network (`fetch`/`XMLHttpRequest` are
`undefined`) and its own filesystem (`import fs` throws). That does **not** block
you from downloading a resource the page can already reach — you just have to do
it **through the browser**, never through Node.

Two facts make this work:

1. **The `playwright` module is the real library**, running host-side with the
   real fs. Only the *script's* `import fs` / `fetch` are inert. So a Playwright
   call that writes a file (`download.saveAs`) uses the real fs.
2. **Artifacts = everything under `process.cwd()`.** After a run, the host
   recursively scans the run workspace (`process.cwd()` === the real `outputDir`)
   and collects every file as a downloadable artifact. So any file you land in
   `process.cwd()` is returned to the user — no host capability needed.

Rule of thumb: **fetch with the browser, save with Playwright, into
`process.cwd()`.**

---

## Pattern A — trigger a browser download, `saveAs` into the workspace (preferred)

Use this whenever you want the resource **saved as a run artifact**. It uses the
browser's network stack (correct cookies/referer/session) and Playwright's real
fs.

### A1. A real download link/button exists (PDF, export, "Download" button)

```typescript
import path from 'node:path'

const [download] = await Promise.all([
  page.waitForEvent('download'),                       // arm BEFORE the click
  page.getByRole('link', { name: 'Download' }).click(),
])
const dest = path.join(process.cwd(), 'downloads', download.suggestedFilename())
await download.saveAs(dest)                            // → collected as artifact
console.log(`saved ${download.suggestedFilename()}`)
```

### A2. Only a resource URL (e.g. an `<img src>`), no download link

Fetch **inside the page** (browser context, so it's allowed and carries the
session), turn the bytes into a blob download, then `saveAs`. This preserves the
original bytes/format and works cross-origin when the page's CORS allows the
fetch:

```typescript
import path from 'node:path'

async function saveResource(page, url, fileName) {
  const downloadPromise = page.waitForEvent('download')
  await page.evaluate(async (u) => {
    const res = await fetch(u)                          // PAGE's fetch = browser, allowed
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'resource'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(a.href)
  }, url)
  const download = await downloadPromise
  const dest = path.join(process.cwd(), fileName)
  await download.saveAs(dest)
  return dest
}
```

> `page.evaluate(() => fetch(...))` runs in the **browser**, not the sandbox —
> it is *not* the blocked Node `fetch`. Only bare `fetch(...)` at script scope is
> forbidden.

---

## Pattern B — get the bytes in-script (hash / feed to LLM / base64 into KV)

When you need the **bytes in the script** rather than a saved file, use the
context-bound request client. It shares the page's cookie jar and rides the
Playwright connection (not the blocked `fetch`):

```typescript
const res = await page.request.get(imageUrl)
if (!res.ok())
  throw new Error(`fetch failed: ${res.status()}`)
const buf = await res.body()                            // Buffer
console.log(`got ${buf.length} bytes, type=${res.headers()['content-type']}`)
```

You **cannot** persist this `Buffer` with `fs` (blocked). Options:
- Feed it onward (hash it, pass to `@roxybrowser/sandbox/llm`, etc.).
- Small blobs only: base64 into `@roxybrowser/sandbox/kv` — acceptable for a few
  small files, wasteful for large/many images. For a saved-file deliverable
  prefer **Pattern A** (it writes real binary into the artifact dir).

---

## Batch: every `<img>` on the page

```typescript
import path from 'node:path'

const urls = await page.evaluate(() =>
  [...document.querySelectorAll('img')]
    .map(img => img.currentSrc || img.src)
    .filter(u => u && u.startsWith('http')),
)
console.log(`found ${urls.length} images`)

let i = 0
for (const url of urls) {
  try {
    const ext = (new URL(url).pathname.split('.').pop() || 'img').slice(0, 5)
    await saveResource(page, url, path.join('images', `${i++}.${ext}`))
  }
  catch (err) {
    console.debug(`skip ${url}: ${err.message}`)        // don't let one bad url kill the run
  }
}
```

---

## Gotchas

- **Arm `waitForEvent('download')` before the action that triggers it** — a
  `Promise.all([...])` pattern (or assigning the promise first) avoids the race.
- **`saveAs` needs an absolute path under `process.cwd()`.** Build it with
  `path.join(process.cwd(), ...)`; anything outside won't be collected as an
  artifact. `path`/`node:path` are whitelisted.
- **The cross-origin `download` attribute is unreliable** on a raw `<a>` — that's
  why A2 fetches to a **blob** first (blob URLs always honor `download`).
- **A pure `<canvas>` / CSS-background image** isn't an `<img>` URL — use
  `elementHandle.screenshot({ path: ... })` (re-encoded PNG, not the original
  bytes) or read the canvas via `toDataURL()` in `page.evaluate`.
- **Big/many files** inflate the artifact bundle — cap the count and log what you
  skipped rather than silently truncating.
