# amz-04 — Fallback selector chain + multi-image hover sequence + add to cart

**Pattern**: fallback selector 链 + 多图依次 hover + 加购,结果用断言而非截图确认
**Capability clusters**: C3 (搜索引擎流) + C8 (响应式分支 / fallback) + C12 (hover 序列)
**User intent keywords**: "优先 #X 不存在则 #Y" / "fallback selector" / "依次悬停 N 张图" / "悬停浏览图片" / "加入购物车"

## Distinctive techniques

- **`findFallback(selectors[], timeoutMs)` helper**: walks selector list in order, splits the timeout budget evenly, returns the first one that becomes visible. Cleaner than nested try/catch, and budget-aware so a long initial wait doesn't starve the fallback path.
- **Hover loop without click**: `for (i in 0..3) hover(altImages.nth(i))` — multi-image carousel preview is a distinct pattern from "hover-then-click" (x-02 / x-04). No interaction beyond the hover; the page reacts visually.
- **Stop hover sequence on missing element**: `count() === 0 → break`, don't iterate over phantom indices.
- **Browse-scroll via `humanScroll`** from `@roxybrowser/sandbox/human` — bottom-then-return is a human-like "I read everything" signal. Import it; don't hand-roll a wheel loop.
- **Confirm the cart-add by assertion, not screenshot**: a saved screenshot can't be the run deliverable (the log is the observable signal — SKILL.md §5). Instead assert the observable result — the cart-added confirmation panel (`#sw-atc-confirmation`, or the `i.a-icon-alert` warning) — and `console.log` the verdict. For a visual capture while debugging, run under the **debug** profile with `capturePageState` (see `references/debugging.md`).
- **`Math.min(randomBetween(2,7), productCount-1)`** for product selection: random 1-based "3-8" mapped to 0-based 2-7, capped at actual length to avoid out-of-range.

## Canonical implementation

```typescript
// Task: goto Amazon → fallback selector (#nav-bb-search or #twotabsearchtextbox)
//       → type random keyword + Enter → scroll → click random product (3-8) → wait main image
//       → hover 3 thumbnails in order → scroll bottom → scroll top → add to cart → assert result
// Runtime: roxy-agent sandbox injects BROWSER_URL/CDP_URL/BROWSER_TYPE.

import type { Page } from 'playwright'
import { chromium, firefox } from 'playwright'
import { sleep, randomBetween, pick } from '@roxybrowser/sandbox/utils'
import { humanScroll } from '@roxybrowser/sandbox/human'

const BROWSER_URL = process.env.BROWSER_URL ?? ''
const CDP_URL = process.env.CDP_URL ?? ''
const BROWSER_TYPE = process.env.BROWSER_TYPE ?? 'chromium'

const KEYWORDS = ['books', 'tools', 'pillows', 'keyboards']

async function findFallback(page: Page, selectors: string[], timeoutMs = 30000): Promise<string | null> {
  for (const sel of selectors) {
    try {
      await page.locator(sel).first().waitFor({ state: 'visible', timeout: timeoutMs / selectors.length })
      return sel
    }
    catch { /* try next */ }
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

  await page.goto('https://www.amazon.com/', { timeout: 30000 })

  const searchSel = await findFallback(page, ['#nav-bb-search', '#twotabsearchtextbox'])
  if (!searchSel) {
    console.error('No search box found (neither #nav-bb-search nor #twotabsearchtextbox)')
    console.error('[search_box_missing]')
    await browser.close()
    return
  }
  console.log(`Using search selector: ${searchSel}`)
  await sleep(5000, 6500)

  const keyword = pick(KEYWORDS)
  await page.locator(searchSel).first().fill(keyword)
  await sleep(1200, 1400)
  await page.keyboard.press('Enter')

  // Wait for results
  await page.locator('div[data-asin] .a-link-normal .s-image').first().waitFor({ state: 'visible', timeout: 30000 })
  await sleep(4500, 5500)

  // Scroll: middle then a short human-like nudge
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' }))
  await sleep(800, 1500)
  await humanScroll(page, { distance: 200, direction: 'down' })
  await sleep(800, 1500)

  // Click random product (index 3..8)
  const productImages = page.locator('div[data-asin] .a-link-normal .s-image')
  const productCount = await productImages.count()
  console.log(`Found ${productCount} product images`)
  if (productCount === 0) {
    console.error('No products')
    console.error('[no_products]')
    await browser.close()
    return
  }
  const targetIdx = Math.min(randomBetween(2, 7), productCount - 1) // 0-based; "3-8" in 1-based
  console.log(`Clicking product index ${targetIdx}`)
  await productImages.nth(targetIdx).click()

  // Wait for product detail main image
  await page.locator('#imgTagWrapperId').first().waitFor({ state: 'visible', timeout: 30000 })
  await sleep(5000, 6000)

  // Hover through 3 alt images
  for (let i = 0; i < 3; i++) {
    const alt = page.locator('#altImages .item').nth(i)
    if (await alt.count() === 0) {
      console.log(`Alt image ${i + 1} missing, stopping hover sequence`)
      break
    }
    await alt.hover()
    console.log(`Hovered alt image ${i + 1}`)
    await sleep(500, 800)
  }

  // Scroll to bottom then back to top
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
  await sleep(1000, 1500)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(2000, 2400)

  // Add to cart
  const addToCart = page.locator('.a-button-stack #add-to-cart-button').first()
  if (await addToCart.count() === 0) {
    console.log('Add-to-cart button missing (maybe out of stock or login required)')
    await browser.close()
    return
  }
  await addToCart.click()

  // Confirm by assertion, not screenshot: either the added-confirmation panel or the alert warning.
  const confirmed = page.locator('#sw-atc-confirmation, #huc-v2-order-row-confirm-text').first()
  const alert = page.locator('i.a-icon-alert').first()
  const added = await confirmed.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false)
  if (added) {
    console.log('Add to cart confirmed')
  }
  else if (await alert.count() > 0) {
    console.log('Add to cart blocked — alert shown (e.g. must choose a variant / sign in)')
  }
  else {
    console.log('No explicit confirmation or alert — result inconclusive from the DOM')
  }

  console.log('[closing_browser]')
  await browser.close()
}

```
