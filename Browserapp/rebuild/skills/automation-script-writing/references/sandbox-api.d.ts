// ============================================================================
// @roxybrowser/sandbox — 脚本可用能力的完整接口定义（type-only）
// ============================================================================
//
// 这是写自动化脚本时能 import 的全部 sandbox 能力。**建议优先使用这些 package 提供的能力，您的需求超出了 package 提供的范围，那么就让agent帮您实现**
//
// 用法：
//   import { sleep, pick }        from '@roxybrowser/sandbox/utils'
//   import { humanScroll }        from '@roxybrowser/sandbox/human'
//   import { ask, json }          from '@roxybrowser/sandbox/llm'
//   import { Table }              from '@roxybrowser/sandbox/table'
//   import { KV }                 from '@roxybrowser/sandbox/kv'
//   import { capturePageState }   from '@roxybrowser/sandbox/debug'
//
// 分层（决定“调用它要付出什么”）：
//   • pure  — /utils /human           无网络、无密钥、免费、确定性。随意用。
//   • host  — /llm /table /kv /debug   经宿主执行：可能慢/计费（llm）、落盘（table/kv/debug）。
//
// 关于 fs：脚本**不能** `import fs`（`fs` / `node:fs` / `fs/promises` 在运行时抛
// "Module not allowed"）。持久化一律走 `/table`（表格/CSV）或 `/kv`（键值/JSON）；
// 调试期落盘（页面快照 / 调试文件）走 `/debug`——release profile 下 no-op，debug profile
// 下才真正写入 `html-snapshots/`。所有真实 fs 都在宿主侧完成，脚本侧拿不到 fs。
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
declare module '@roxybrowser/sandbox/utils' {
  /** 随机等待 [min, max] 毫秒（含端点）。相比较于 waitForTimeout，它更加拟人化，拥有随机性。 */
  export function sleep(min: number, max: number): Promise<void>

  /** 返回 [min, max] 内的随机整数（含端点）。用于滚动距离、索引、次数。 */
  export function randomBetween(min: number, max: number): number

  /** 从数组中等概率随机取一个元素。 */
  export function pick<T>(arr: readonly T[]): T

  /** 以概率 probability ∈ [0,1] 返回 true。可用于可选动作（如 70% 概率点赞）。 */
  export function maybe(probability: number): boolean

  /** 把数组按固定长度切分成若干块。用于分页 / 分批。 */
  export function chunk<T>(arr: readonly T[], size: number): T[][]

  export interface RetryOptions {
    /** 最大尝试次数（含首次）。默认 3。 */
    attempts?: number
    /** 首次重试前的基础延迟（ms）。默认 500。 */
    baseDelay?: number
    /** 退避因子：第 n 次重试延迟 = baseDelay * factor^(n-1)。默认 2（指数退避）。 */
    factor?: number
    /** 每次失败后的回调（可用于日志）。 */
    onRetry?: (error: unknown, attempt: number) => void
  }

  /**
   * 带指数退避的重试。适合偶发网络/渲染抖动的操作（如 waitForSelector、点击）。
   * 所有尝试都失败时抛出最后一次的错误。
   */
  export function retry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T>
}

// ─────────────────────────────────────────────────────────────────────────────
declare module '@roxybrowser/sandbox/human' {
  import type { Page } from 'playwright'

  export interface HumanScrollOptions {
    /** 目标滚动总距离（px）。 */
    distance: number
    /** 方向。默认 'down'。 */
    direction?: 'down' | 'up'
    /** 每步滚动距离范围（px）。默认 50~150。 */
    stepMin?: number
    stepMax?: number
    /** 每步之间的停顿范围（ms）。默认 30~80。 */
    delayMin?: number
    delayMax?: number
    /** 概率性“往回滚一小段”以模拟真人犹豫。默认 0（关闭）。 */
    backstepChance?: number
    /** 回滚距离相对当前步长的比例。默认 0.3。 */
    backstepRatio?: number
  }

  /**
   * 通过真实 WheelEvent 分多步平滑滚动，可选概率回滚。
   * 用于信息流浏览 / 懒加载 / 反爬拟人——**不是**为了让元素可见（.click() 会自动
   * scrollIntoView，使用滚动的方式去“凑”可见性不可靠）。
   */
  export function humanScroll(page: Page, opts: HumanScrollOptions): Promise<void>

  export interface HumanTypeOptions {
    /** 每个字符之间的击键延迟范围（ms）。默认 60~180。 */
    minDelay?: number
    maxDelay?: number
  }

  /**
   * 逐字符拟人输入：每键之间以随机延迟敲入，避免瞬时 fill 触发反自动化检测。
   * 需先聚焦目标输入框（如先 locator.click()）。
   */
  export function humanType(page: Page, text: string, opts?: HumanTypeOptions): Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
declare module '@roxybrowser/sandbox/llm' {
  /** 单次调用可带的参数。 */
  export interface LlmCallOptions {
    /** 采样温度（0~2）。结构化任务建议低温度。 */
    temperature?: number
    /** 最大生成 token 数。 */
    maxTokens?: number
    /** 中止信号——脚本被 abort 时应一并取消本次调用。 */
    signal?: AbortSignal
  }

  /** 文本：给定 prompt，返回模型生成的纯文本。 */
  export function ask(prompt: string, opts?: LlmCallOptions): Promise<string>

  /**
   * 结构化：给定 prompt 与完整 JSON Schema，返回符合 schema 的对象。
   * 需要结构化输出（分类、抽取、判断…）时用它，schema 描述期望结构。
   * @example
   * const { price } = await json<{ price: number }>(prompt, {
   *   type: 'object', properties: { price: { type: 'number' } }, required: ['price'],
   * })
   */
  export function json<T = unknown>(prompt: string, schema: object, opts?: LlmCallOptions): Promise<T>
}

// ─────────────────────────────────────────────────────────────────────────────
declare module '@roxybrowser/sandbox/table' {
  /** 一条记录（一行）：扁平的键值对。 */
  export type TableRecord = Record<string, unknown>

  /**
   * 表格持久化（采用 CSV 的格式，持久化到本地）。常用于记录脚本的一些采集信息。
   * `new Table(name)` 异步载入内存（文件缺失则创建）；。
   * @example
   * const rec = new Table('yanghao-record')
   * await rec.append({ account: 'a1', action: 'like', at: Date.now() })
   * const rows = await rec.all<{ account: string, action: string }>()
   * const one  = await rec.find(r => r.account === 'a1')
   */
  export class Table {
    /** @param name 表逻辑名（对应存放目录下的 `<name>.csv`）。 */
    constructor(name: string)
    /** 表逻辑名。 */
    get name(): string
    /** 首次写入以记录的键作为表头；后续按已有表头对齐（缺失列留空）。 */
    append(record: TableRecord | TableRecord[]): Promise<void>
    /** 读取全部行。 */
    all<T extends TableRecord = TableRecord>(): Promise<T[]>
    /** 在内存中查找第一条满足条件的行；无匹配返回 undefined。 */
    find<T extends TableRecord = TableRecord>(predicate: (row: T, index: number) => boolean): Promise<T | undefined>
    /** 清空表。 */
    clear(): Promise<void>
  }
}

// ─────────────────────────────────────────────────────────────────────────────
declare module '@roxybrowser/sandbox/kv' {
  /**
   * 
   * `new KV(name)` 采用键值对的形式持久化。（文件缺失则创建）
   *
   * @example
   * const state = new KV('yanghao-state')
   * await state.set('a1:lastRun', Date.now())
   * const last = await state.get<number>('a1:lastRun')
   */
  export class KV {
    /** @param name KV 命名空间逻辑名（对应存放目录下的 `<name>.kv.json`）。 */
    constructor(name: string)
    /** KV 命名空间逻辑名。 */
    get name(): string
    /** 读取一个键；不存在返回 undefined。 */
    get<T = unknown>(key: string): Promise<T | undefined>
    /** 写入一个键（值需可 JSON 序列化）。 */
    set(key: string, value: unknown): Promise<void>
    /** 键是否存在。 */
    has(key: string): Promise<boolean>
    /** 删除一个键；返回删除前是否存在。 */
    delete(key: string): Promise<boolean>
    /** 所有键。 */
    keys(): Promise<string[]>
    /** 整个键值快照。 */
    all<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<T>
    /** 清空整个命名空间。 */
    clear(): Promise<void>
  }
}

// ─────────────────────────────────────────────────────────────────────────────
declare module '@roxybrowser/sandbox/debug' {
  import type { Page } from 'playwright'

  /**
   * 捕获页面当前完整 HTML，写入 `html-snapshots/<label>.html`。
   *
   * 语义（与 console.debug 一致）：
   * - **release** profile（默认）：no-op，静默不写，可安全留在成品脚本里。
   * - **debug** profile：真正落盘；运行后用 `read_file('html-snapshots/<label>.html')` 读回，
   *   做 before/after 页面态对比诊断。
   *
   * @param page  Playwright `Page`（结构兼容即可）。
   * @param label 短横线命名的阶段标签（如 `before-submit`）；不允许 `/`、`\`、`..`。
   * @example
   * import { capturePageState } from '@roxybrowser/sandbox/debug'
   * await capturePageState(page, 'before-submit')
   * await page.getByRole('button', { name: 'Submit' }).click()
   * await capturePageState(page, 'after-submit')
   */
  export function capturePageState(page: Page, label: string): Promise<void>

  /**
   * 写一份任意调试文件到 `html-snapshots/<name>`（如抽取的 JSON、中间态转储）。
   * release 下 no-op，debug 下落盘。运行后用 `read_file('html-snapshots/<name>')` 读回。
   *
   * @param name    文件名（含扩展名，如 `parsed.json`）；不允许 `/`、`\`、`..`。
   * @param content 文件内容（文本）。
   */
  export function writeDebugFile(name: string, content: string): Promise<void>
}
