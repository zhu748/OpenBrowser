# x-04 — Like + reply with dialog-vs-inline composer branching

**Pattern**: 二选一分支(对话框 vs 内联输入框)+ 拟人回复
**Capability clusters**: C5 (UGC 评论) + C9 (二选一 / dialog-existence) + C12 (hover 序列)
**User intent keywords**: "回复对话框" / "对话框是否弹出" / "二选一" / "either dialog or inline" / "dialog.count() > 0" / "if-else composer"

## Distinctive techniques

- **Dialog-existence binary branch**: `count() > 0 && isVisible()` decides between two textareas. **Don't `await isVisible()` directly on missing elements** — it throws if the element isn't attached, which is why we guard with `count()` first.
- **Different scope per branch** — dialog branch clicks into `[role="dialog"] [data-contents="true"]`, inline branch clicks into `[role="main"] [data-contents="true"]`. Same intent, different DOM scope. Same `replyText` selected once via `pick(REPLIES)` so the branches stay parallel.
- **Focus in the branch, then `humanType(page, text)`** — after the branch's `.click()` focuses the contenteditable, `humanType` sends per-key keyboard events to the focused element regardless of which selector won. This is the reason to type via the page/keyboard rather than a locator-bound `.type()` (which is also deprecated); `humanType` from `@roxybrowser/sandbox/human` is the built-in for it.
- **Multiple hover→click on the same selector via `.nth(N)`** — not a generic `[data-testid="like"].first()` repeated; `nth(0)` for post 1, `nth(2)` for post 3 to act on different cards.
- **Confirm the send by assertion, not screenshot**: assert the composer closed (the tweet button detaches) and `console.log` the verdict — a saved screenshot isn't the observable signal. Use `capturePageState` under the debug profile for a visual (`references/debugging.md`).

## Canonical implementation

```typescript
// Task: scroll 6543 → back to top → hover+click 1st like → hover+click 3rd like → hover+click 3rd reply
//       → dialog present ? type in dialog : type in main → post → assert sent
// Runtime: roxy-agent sandbox injects BROWSER_URL/CDP_URL/BROWSER_TYPE.

import { chromium, firefox } from 'playwright'
import { sleep, pick } from '@roxybrowser/sandbox/utils'
import { humanScroll, humanType } from '@roxybrowser/sandbox/human'

const BROWSER_URL = process.env.BROWSER_URL ?? ''
const CDP_URL = process.env.CDP_URL ?? ''
const BROWSER_TYPE = process.env.BROWSER_TYPE ?? 'chromium'

const REPLIES = ['Good Luck!', 'Have a nice day~']

export async function main(): Promise<void> {
  const browser = BROWSER_URL
    ? (BROWSER_TYPE === 'firefox' ? await firefox.connect(BROWSER_URL) : await chromium.connect(BROWSER_URL))
    : await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0] ?? await browser.newContext()
  const page = context.pages()[0] ?? await context.newPage()
  console.log('[start]')

  await page.goto('https://twitter.com/', { timeout: 30000 })
  await page.locator('[role="button"][data-testid="like"]').first().waitFor({ state: 'visible', timeout: 30000 })
  await sleep(5500, 7500)

  await humanScroll(page, { distance: 6543, direction: 'down' })
  await sleep(800, 1500)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(1500, 2500)

  // Like the 1st post (index 0)
  const like1 = page.locator('[role="button"][data-testid="like"]').nth(0)
  await like1.scrollIntoViewIfNeeded()
  await like1.hover()
  await sleep(2400, 4300)
  await like1.click()
  console.log('Liked post 1')
  await sleep(2100, 3100)

  // Like the 3rd post (index 2)
  const like3 = page.locator('[role="button"][data-testid="like"]').nth(2)
  await like3.scrollIntoViewIfNeeded()
  await like3.hover()
  await sleep(1100, 1200)
  await like3.click()
  console.log('Liked post 3')
  await sleep(1200, 2100)

  // Reply on the 3rd post
  const reply3 = page.locator('[data-testid="reply"]').nth(2)
  await reply3.scrollIntoViewIfNeeded()
  await reply3.hover()
  await sleep(1200, 1300)
  await reply3.click()
  await sleep(2400, 4300)

  // Branch: dialog vs main page composer
  const dialogTextarea = page.locator('[role="dialog"] [data-contents="true"]').first()
  const mainTextarea = page.locator('[role="main"] [data-contents="true"]').first()
  const replyText = pick(REPLIES)

  if (await dialogTextarea.count() > 0 && await dialogTextarea.isVisible()) {
    console.log('Dialog branch: typing in dialog composer')
    await dialogTextarea.click()
  }
  else {
    console.log('Inline branch: typing in main page composer')
    await mainTextarea.click()
  }
  await sleep(300, 600)
  await humanType(page, replyText) // types to the focused composer, whichever branch won
  await sleep(3400, 4300)

  // Submit reply
  const tweetBtn = page.locator('[data-testid="tweetButton"]').first()
  await tweetBtn.hover()
  await sleep(1100, 1200)
  await tweetBtn.click()

  // Assert the composer closed (reply sent) rather than screenshotting
  const sent = await tweetBtn.waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false)
  console.log(sent ? `Posted reply: "${replyText}"` : 'Reply button still present — send may not have gone through')

  console.log('[closing_browser]')
  await browser.close()
}

```
