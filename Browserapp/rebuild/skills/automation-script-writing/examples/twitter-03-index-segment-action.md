# x-03 — Index-segmented Like / Retweet on a feed

**Pattern**: 单循环按索引分段动作(前 N 点赞 / 次 M 转推 / 到界 break)
**Capability clusters**: C4 (信息流批量互动 / index-segment action)
**User intent keywords**: "遍历推文" / "前 N 条点赞" / "第 N-M 条转推" / "iterate articles" / "by index range"

## Distinctive techniques

- **Single iteration loop, multi-branch by index**: one `for` loop over `article[data-testid="tweet"]`, with `if (i < 3) { like } else if (i < 6) { retweet } else { break }`.
- **Hover before click on every interaction button** (`scrollIntoViewIfNeeded` → `hover` → `click`) — replay reliability requires the hover even if operation-time click succeeded directly.
- **Two-step retweet** with `[data-testid="retweet"][aria-expanded="false"]` outer button → wait → `[data-testid="Dropdown"] [data-testid="retweetConfirm"]` confirm.
- **`.first()` on per-article locator** — the article scope (`articles.nth(i).locator(...)`) is what stabilizes selection, not viewport heuristics.
- **Skip-on-missing**: each interaction guards with `count() === 0 → continue`, so a missing like/retweet button on one tweet doesn't kill the loop.
- **Terminate at index 6 with a log, not a screenshot**: the original recorded a screenshot at the boundary, but a saved screenshot isn't the observable signal. The `i >= 6` break is the real terminal signal; log it. Use `capturePageState` under the debug profile if a visual is needed (`references/debugging.md`).

## Canonical implementation

```typescript
// Task: scroll 8514px → back to top → iterate tweets: first 3 like, 4-6 retweet+confirm, >=6 break
// Runtime: roxy-agent sandbox injects BROWSER_URL/CDP_URL/BROWSER_TYPE.

import { chromium, firefox } from 'playwright'
import { sleep } from '@roxybrowser/sandbox/utils'
import { humanScroll } from '@roxybrowser/sandbox/human'

const BROWSER_URL = process.env.BROWSER_URL ?? ''
const CDP_URL = process.env.CDP_URL ?? ''
const BROWSER_TYPE = process.env.BROWSER_TYPE ?? 'chromium'

export async function main(): Promise<void> {
  const browser = BROWSER_URL
    ? (BROWSER_TYPE === 'firefox' ? await firefox.connect(BROWSER_URL) : await chromium.connect(BROWSER_URL))
    : await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0] ?? await browser.newContext()
  const page = context.pages()[0] ?? await context.newPage()
  console.log('[start]')

  await page.goto('https://twitter.com/home', { timeout: 30000 })
  await sleep(5500, 6500)

  await humanScroll(page, { distance: 8514, direction: 'down' })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(1500, 2500)

  const articles = page.locator('article[data-testid="tweet"]')
  const total = await articles.count()
  console.log(`Found ${total} tweets`)

  for (let i = 0; i < total; i++) {
    if (i >= 6) {
      console.log('Reached tweet 6, breaking')
      break
    }

    const article = articles.nth(i)

    if (i < 3) {
      const likeBtn = article.locator('[data-testid="like"]').first()
      if (await likeBtn.count() === 0) {
        console.log(`Tweet ${i}: like btn missing, skip`)
        continue
      }
      await likeBtn.scrollIntoViewIfNeeded()
      await likeBtn.hover()
      await sleep(1100, 1500)
      await likeBtn.click()
      console.log(`Liked tweet ${i}`)
    }
    else {
      const retweetBtn = article.locator('[data-testid="retweet"][aria-expanded="false"]').first()
      if (await retweetBtn.count() === 0) {
        console.log(`Tweet ${i}: retweet btn missing or already retweeted, skip`)
        continue
      }
      await retweetBtn.scrollIntoViewIfNeeded()
      await retweetBtn.hover()
      await sleep(1100, 1500)
      await retweetBtn.click()
      await sleep(2600, 3200)
      const confirm = page.locator('[data-testid="Dropdown"] [data-testid="retweetConfirm"]')
      await confirm.waitFor({ state: 'visible', timeout: 10000 })
      await confirm.click()
      console.log(`Retweeted tweet ${i}`)
    }
    await sleep(1000, 2000)
  }

  console.log('[closing_browser]')
  await browser.close()
}

```
