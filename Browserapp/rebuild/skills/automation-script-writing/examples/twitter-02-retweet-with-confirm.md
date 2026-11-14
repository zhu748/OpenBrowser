# x-02 — Retweet first N posts (hover+click+dropdown confirm), then compose

**Pattern**: 信息流批量转推(hover→click→下拉确认)+ 拟人输入发推
**Capability clusters**: C4 (信息流批量互动) + C5 (UGC 发帖) + C12 (hover 序列)
**User intent keywords**: "转推前 N 条" / "retweet" / "下拉菜单确认" / "hover before click" / "发推" / "compose tweet"

## Distinctive techniques

- **Three-step retweet sequence**: `hover` → `click outer button` → wait → `click [data-testid="Dropdown"] [role="menuitem"]` confirm. Skipping the hover causes the dropdown to never render at replay time.
- **Bounded loop with `Math.min(2, total)`**: count first, retweet only the smaller of "2" and "available" — avoids out-of-range when feed shows < 2 non-retweeted posts.
- **Filter via attribute selector**: `[data-testid="retweet"][aria-expanded="false"]` excludes already-retweeted posts at locator time, no extra branching needed.
- **`humanType` for the tweet body** from `@roxybrowser/sandbox/human` — per-key randomized delay avoids the instant-`fill` signature that anti-automation flags. Prefer it over the deprecated `locator.type({ delay })`; focus the composer first (`.click()`), then `humanType(page, text)`.
- **Single `pick(options.tweets ?? TWEET_TEXTS)`** for compose content; the caller may override the default copy array via `options.tweets`, otherwise the built-in `TWEET_TEXTS` is used.
- **`humanScroll`** from `@roxybrowser/sandbox/human` for the feed scroll — import, don't hand-roll.

## Canonical implementation

```typescript
// Task: scroll 8645px → find non-retweeted tweets → first 2: hover+click+dropdown confirm
//       → scroll back to top → compose + post → assert posted
// Runtime: roxy-agent sandbox injects BROWSER_URL/CDP_URL/BROWSER_TYPE.

import { chromium, firefox } from 'playwright'
import { sleep, pick } from '@roxybrowser/sandbox/utils'
import { humanScroll, humanType } from '@roxybrowser/sandbox/human'

const BROWSER_URL = process.env.BROWSER_URL ?? ''
const CDP_URL = process.env.CDP_URL ?? ''
const BROWSER_TYPE = process.env.BROWSER_TYPE ?? 'chromium'

const TWEET_TEXTS = [
  'Hello,World! I am so happy today~',
  'Hi, I love you so much!',
  'Well, everything is ok~',
]

interface TweetOptions {
  /** Optional: override the default tweet-copy list. */
  tweets?: string[]
}

export async function main(options: TweetOptions = {}): Promise<void> {
  const browser = BROWSER_URL
    ? (BROWSER_TYPE === 'firefox' ? await firefox.connect(BROWSER_URL) : await chromium.connect(BROWSER_URL))
    : await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0] ?? await browser.newContext()
  const page = context.pages()[0] ?? await context.newPage()
  console.log('[start]')

  await page.goto('https://twitter.com/home', { timeout: 30000 })
  await sleep(5500, 6100)

  await humanScroll(page, { distance: 8645, direction: 'down' })
  await sleep(1000, 2000)

  // Retweet first 2 non-retweeted posts
  const retweetSelector = 'article [role="group"] [data-testid="retweet"][aria-expanded="false"]'
  const retweetButtons = page.locator(retweetSelector)
  const total = await retweetButtons.count()
  console.log(`Found ${total} non-retweeted posts`)

  const targetCount = Math.min(2, total)
  for (let i = 0; i < targetCount; i++) {
    const btn = retweetButtons.nth(i)
    if (await btn.count() === 0)
      break
    await btn.scrollIntoViewIfNeeded()
    await btn.hover()
    await sleep(1000, 1200)
    await btn.click()
    await sleep(2500, 3000)

    const menuItem = page.locator('[data-testid="Dropdown"] [role="menuitem"]').first()
    await menuItem.waitFor({ state: 'visible', timeout: 10000 })
    await menuItem.click()
    console.log(`Retweeted post ${i + 1}/${targetCount}`)
    await sleep(2300, 3100)
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(1500, 2500)

  // Compose new tweet
  const textbox = page.locator('[role="textbox"][tabindex="0"]').first()
  await textbox.click()
  await sleep(500, 1000)
  const tweetText = pick(options.tweets ?? TWEET_TEXTS)
  await humanType(page, tweetText)
  await sleep(2100, 2200)

  await page.locator('[data-testid="tweetButtonInline"]').click()

  // Assert the composer cleared (tweet sent) rather than screenshotting
  const posted = await textbox.waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false)
  console.log(posted ? `Posted tweet: "${tweetText}"` : 'Composer still present — post may not have gone through')

  console.log('[closing_browser]')
  await browser.close()
}

```
