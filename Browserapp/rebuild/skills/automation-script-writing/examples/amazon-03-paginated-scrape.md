# amz-03 — Amazon reviews paginated scrape → Table (10 pages, break on missing next)

**Pattern**: 翻页累积采集(`.a-last a` 断页)→ `Table` 逐行持久化 + 一次性 header 表
**Capability clusters**: C3 (搜索引擎流) + C6 (数据采集 + 持久化) + C14 (翻页累积)
**User intent keywords**: "翻页累积" / "下一页" / "评论采集" / "导出 CSV" / "Loop 10 次提取" / ".a-last 下一页"

## Distinctive techniques

- **Two-table write pattern**: header info (product title / rating count / reviews header) goes to `Table('airpod-reviews-header')` once; per-card rows append to `Table('airpod-reviews')` continuously. Don't conflate metadata and rows in one table.
- **`safeText(parent, child, idx)` helper** — wraps `page.locator(parent).nth(idx).locator(child).first().innerText()` with `count() === 0 → ''` guard. Replaces 6 try/catch blocks with one helper, avoids per-field crashes on missing data.
- **Pagination break on missing `.a-last a`**: `count() === 0 → break`. The "next" link disappears on the last page; that's the natural stop signal — don't try to count pages forward.
- **Persist through `Table`, not raw `fs`**: `Table.append(row)` derives the CSV header from the record keys and escapes fields itself — no hand-rolled `csvEscape`, no `appendFileSync`. Because it writes memory-first then flushes, partial data survives a mid-loop crash, same as the old incremental-append pattern. Raw `fs` is a no-op under release (would silently drop the file); `Table` is the release-safe path (SKILL.md §3). Newlines in review bodies are the field's own data — `Table` handles the escaping, so no manual `\n` collapsing is needed.

## Canonical implementation

```typescript
// Task: goto AirPods reviews → extract title / rating count / header → header Table
//       → loop 10×: iterate review cards, extract 6 fields → append rows Table → next page; break when no next
// Persistence: header → Table('airpod-reviews-header'); rows → Table('airpod-reviews') (both CSV, release-safe).
// Runtime: roxy-agent sandbox injects BROWSER_URL/CDP_URL/BROWSER_TYPE.

import type { Page } from 'playwright'
import { chromium, firefox } from 'playwright'
import { sleep } from '@roxybrowser/sandbox/utils'
import { Table } from '@roxybrowser/sandbox/table'

const BROWSER_URL = process.env.BROWSER_URL ?? ''
const CDP_URL = process.env.CDP_URL ?? ''
const BROWSER_TYPE = process.env.BROWSER_TYPE ?? 'chromium'

const REVIEWS_URL
  = 'https://www.amazon.com/Apple-AirPods-Charging-Latest-Model/product-reviews/B07PXGQC1Q/'
    + 'ref=cm_cr_arp_d_paging_btm_next_2?ie=UTF8&reviewerType=all_reviews'

async function safeText(page: Page, parentSel: string, childSel: string, idx: number): Promise<string> {
  try {
    const loc = page.locator(parentSel).nth(idx).locator(childSel).first()
    if (await loc.count() === 0)
      return ''
    return (await loc.innerText()).trim()
  }
  catch { return '' }
}

export async function main(): Promise<void> {
  const browser = BROWSER_URL
    ? (BROWSER_TYPE === 'firefox' ? await firefox.connect(BROWSER_URL) : await chromium.connect(BROWSER_URL))
    : await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0] ?? await browser.newContext()
  const page = context.pages()[0] ?? await context.newPage()
  console.log('[start]')

  await page.goto(REVIEWS_URL, { timeout: 30000 })
  await page.locator('.product-title').first().waitFor({ state: 'visible', timeout: 30000 })

  const productTitle = await page.locator('.product-title h1 a').first().innerText().catch(() => '')
  const ratingCount = await page
    .locator('[data-hook="cr-filter-info-review-rating-count"]')
    .first()
    .innerText()
    .catch(() => '')
  const reviewsHeader = await page
    .locator('#cm_cr-review_list [data-hook="arp-local-reviews-header"]')
    .first()
    .innerText()
    .catch(() => '')

  const headerTable = new Table('airpod-reviews-header')
  await headerTable.append({ productTitle, ratingCount, reviewsHeader })
  console.log('Header row saved to Table(airpod-reviews-header)')

  const reviewsTable = new Table('airpod-reviews')
  let rowCount = 0

  for (let pageIdx = 0; pageIdx < 10; pageIdx++) {
    console.log(`[Page ${pageIdx + 1}/10]`)
    await page.locator('#cm_cr-review_list').first().waitFor({ state: 'visible', timeout: 30000 })
    await sleep(1000, 1500)

    const cards = page.locator('[id*="-review-card"]')
    const cardCount = await cards.count()
    console.log(`  Found ${cardCount} review cards`)

    for (let i = 0; i < cardCount; i++) {
      await reviewsTable.append({
        profile_name: await safeText(page, '[id*="-review-card"]', '.a-profile-name', i),
        star_rating: await safeText(page, '[id*="-review-card"]', '[data-hook="review-star-rating"]', i),
        title: await safeText(page, '[id*="-review-card"]', '[data-hook="review-title"]', i),
        date: await safeText(page, '[id*="-review-card"]', '[data-hook="review-date"]', i),
        body: await safeText(page, '[id*="-review-card"]', '[data-hook="review-body"]', i),
        helpful: await safeText(page, '[id*="-review-card"]', '[data-hook="helpful-vote-statement"]', i),
      })
      rowCount++
    }

    // Try to click "next page"
    const nextLink = page.locator('.a-last a').first()
    if (await nextLink.count() === 0) {
      console.log('  No next page, stopping')
      break
    }
    await nextLink.click()
    await sleep(2000, 3000)
  }

  console.log(`Done. ${rowCount} rows in Table(airpod-reviews)`)
  console.log('[closing_browser]')
  await browser.close()
}

```
