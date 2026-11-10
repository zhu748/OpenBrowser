'use strict';

const cdp = require('../cdp');
const { applyTrustedChange } = require('./trusted-input');
const humanInput = require('./human-input');
const { TypingAbortedError } = require('./human-typing');
const { TaskScheduler } = require('./task-scheduler');
const {
  getDownloadFileName,
  getFileNameFromContentDisposition,
  classifyTargetFileFailure,
  getDownloadFailureMessage,
} = require('./download-naming');
const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');
const os = require('os');
const {
  parseProcessContent,
  randomNum,
  RPA_PLUS_ACTIONS,
} = require('./protocol/rpa-registry');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Virtual-key codes for named keys the RPA `key` step dispatches directly.
const NAMED_KEY_VK = (name) => {
  const table = { Enter: 13, Tab: 9, Backspace: 8, Delete: 46, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, PageUp: 33, PageDown: 34 };
  const vk = table[name] || 0;
  return { windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
};

// JSON-clone with a cycle fallback: keeps concurrent RPA tasks from sharing
// nested variable objects without throwing on unusual template data.
function cloneVariableValue(value) {
  if (value === null || typeof value !== 'object') return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}
const OUTPUT_DIRECTORY = path.join(process.cwd(), 'rpa-output');
// Launching a browser environment is heavy (disk, CPU, memory). A plan that
// covers many profiles must not boot every kernel at the same instant, so the
// launches go through a small queue. Steps themselves still interleave.
const DEFAULT_OPEN_CONCURRENCY = 2;

function resolveOpenConcurrency(value = process.env.OPENBROWSER_RPA_OPEN_CONCURRENCY) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_OPEN_CONCURRENCY;
  return Math.min(n, 16);
}
const RPA_DIAGNOSTIC_LIMIT = 512 * 1024;
// The kernel refuses CDP automation with this sentence; only its stable prefix
// is matched, so the check does not depend on the product name inside it.
const CDP_AUTOMATION_BLOCKED = 'Browser automation requires a paid';
// Result payloads carry the extracted values: strings are capped at
// RPA_RESULT_CHAR_LIMIT per value; structure is kept whole. Task logs keep the
// original full-content behavior — store growth is bounded by task-history
// pruning and the store size budget, not by log trimming.
const PARSED_RESULT_CHAR_LIMIT = Number(process.env.OPENBROWSER_RPA_RESULT_CHAR_LIMIT);
const RPA_RESULT_CHAR_LIMIT = Number.isFinite(PARSED_RESULT_CHAR_LIMIT) && PARSED_RESULT_CHAR_LIMIT > 0
  ? Math.floor(PARSED_RESULT_CHAR_LIMIT)
  : 20000;

/** Per-string cap for result payloads; structure (arrays/objects) is kept, only string length is capped. */
function capResultString(text) {
  return text.length > RPA_RESULT_CHAR_LIMIT
    ? text.slice(0, RPA_RESULT_CHAR_LIMIT) + `…[truncated ${text.length - RPA_RESULT_CHAR_LIMIT} chars]`
    : text;
}

/**
 * Cycle-safe copy of final task variables for process_result and the API
 * response. Strings are capped per RPA_RESULT_CHAR_LIMIT; everything else is
 * kept whole.
 */
function snapshotVariables(variables) {
  const clone = (value, seen) => {
    if (typeof value === 'function') return '[function]';
    if (typeof value === 'string') return capResultString(value);
    if (value == null || typeof value !== 'object') return value;
    if (seen.has(value)) return '[circular]';
    seen.add(value);
    try {
      if (Array.isArray(value)) return value.map((item) => clone(item, seen));
      const out = {};
      for (const [key, item] of Object.entries(value)) out[key] = clone(item, seen);
      return out;
    } finally {
      seen.delete(value);
    }
  };
  const copied = {};
  for (const [key, value] of Object.entries(variables || {})) copied[key] = clone(value, new Set());
  return copied;
}

/** True when a missing element should not fail the whole flow. */
function isOptionalElementStep(params = {}) {
  // Explicit optional only. Do NOT treat isShow=0 as optional: catalog often uses
  // isShow for visibility mode, not "skip if missing".
  if (params.optional === true || params.optional === 1 || params.optional === '1' || params.optional === 'true') {
    return true;
  }
  const selector = String(params.selector || '');
  // Known ephemeral overlays / geo chrome that commonly absents on locale pages.
  // Keep this list narrow; prefer step.optional=true from sanitizeOptionalOverlaySteps.
  if (/redir-overlay|redir-dismiss|nav-global-location|GLUXZip|GLUXZipUpdateInput|GLUXZipInputSection|GLUXConfirmClose|glow-ingress|#sp-cc-accept/i.test(selector)) {
    return true;
  }
  return false;
}

/** Optional steps may skip only element-missing errors, never CDP/session failures. */
function isMissingElementError(error) {
  const message = String(error?.message || error || '');
  if (!message) return false;
  if (message.includes(CDP_AUTOMATION_BLOCKED)) return false;
  return /Element not found|Selector not found|selectElement failed|No page tab for CDP|useExcel file not found|file path required/i.test(message);
}

/**
 * Split one CSV line honoring double-quoted fields: a quoted field may contain
 * commas, and "" inside it is a literal quote (standard spreadsheet export).
 * A plain split(',') would shift every column after the first quoted comma.
 */
function splitCsvLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const ch = line[index];
    if (quoted) {
      if (ch === '"') {
        if (line[index + 1] === '"') { field += '"'; index += 1; }
        else quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === ',') {
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

function isPathInsideRoot(candidate, root) {
  const child = path.resolve(candidate);
  const base = path.resolve(root);
  const normalize = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
  return normalize(child) === normalize(base) || normalize(child).startsWith(normalize(base) + path.sep);
}

/**
 * Resolve a user-supplied local file path for RPA steps.
 * Absolute paths must stay under OUTPUT_DIRECTORY (or optional extraRoots).
 * Relative paths resolve under OUTPUT_DIRECTORY only.
 */
function resolveSafeRpaPath(filePath, { extraRoots = [] } = {}) {
  const raw = String(filePath || '').trim();
  if (!raw) throw new Error('file path required');
  if (raw.includes('\0')) throw new Error('invalid file path');
  const roots = [OUTPUT_DIRECTORY, ...extraRoots].map((item) => path.resolve(item));
  const resolved = path.isAbsolute(raw)
    ? path.resolve(raw)
    : path.resolve(OUTPUT_DIRECTORY, raw);
  if (!roots.some((root) => isPathInsideRoot(resolved, root))) {
    throw new Error('RPA file path must be inside the RPA output directory');
  }
  return resolved;
}

const EXECUTABLE_STEP_TYPES = new Set([
  'wait', 'sleep', 'delay', 'waittime',
  'goto', 'navigate', 'open', 'gotourl',
  'reload', 'refreshpage',
  'newtab', 'new_tab', 'newpage',
  'closetab', 'close_tab', 'closepage',
  'typetext', 'type', 'input', 'inserttext', 'inputcontent',
  'click', 'clickelement', 'waitforselector', 'fortimes',
  'javascript', 'evaluate', 'script', 'js',
  'scroll', 'scrollpage', 'screenshotpage', 'screenshot',
  'geturl', 'clearcookies', 'startnode', 'noop', 'breakloop', 'break',
  'key', 'press', 'keyboard',
  'combineprocess', 'getelement', 'passingelement', 'hover', 'focuselement',
  'selectelement', 'getrequest',
  'ifelse', 'forelements', 'forlists', 'whiledata', 'tojson', 'extractkey',
  'extractdata', 'savedata', 'exportexcel', 'saveremark', 'variableoperation',
  'goback', 'switchpage', 'uploadattachment', 'downloadfile',
  'waitforresponse', 'getresponse', 'stoplinsten', 'closebrowser',
  'opennewbrowser', 'getopenai',
  'useexcel',
  'importtext', 'randomget', 'get2facode', 'googlesheet', 'getcookies', 'getclipboard', 'getactiveelement',
  'keycombination', 'applysubprocess', 'getcaptcha', 'closeotherpage',
]);

// Action aliases (gotoUrl/clickElement/inputContent/waitTime/...) normalize onto
// the canonical step type each executor handles. Keys are every non-canonical member of
// EXECUTABLE_STEP_TYPES; values are the canonical type (the first name of the old
// if/else chain condition that used to list the whole group). Alias resolution only
// picks the executor — handlers still receive the caller's original `type`, so
// alias-sensitive behavior (log lines, default variable names, per-alias sub-branches
// like tojson/extractkey/extractdata) is unchanged.
const STEP_TYPE_ALIASES = {
  sleep: 'wait', delay: 'wait', waittime: 'wait',
  navigate: 'goto', open: 'goto', gotourl: 'goto',
  refreshpage: 'reload', new_tab: 'newtab', newpage: 'newtab',
  close_tab: 'closetab', closepage: 'closetab', type: 'typetext',
  input: 'typetext', inserttext: 'typetext', inputcontent: 'typetext',
  clickelement: 'click', hover: 'passingelement', extractkey: 'tojson',
  extractdata: 'tojson', getactiveelement: 'getclipboard', applysubprocess: 'keycombination',
  getcaptcha: 'keycombination', closeotherpage: 'keycombination', waitforresponse: 'getrequest',
  getresponse: 'getrequest', stoplinsten: 'getrequest', scrollpage: 'scroll',
  script: 'evaluate', js: 'evaluate', javascript: 'evaluate',
  screenshot: 'screenshotpage', break: 'breakloop', press: 'key',
  keyboard: 'key', noop: 'startnode',
};

function findUnsupportedSteps(steps, path = []) {
  if (!Array.isArray(steps)) return [{ path, type: '', reason: 'steps must be an array' }];
  const unsupported = [];
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index] || {};
    const type = String(step.type || step.action || '').toLowerCase();
    const currentPath = [...path, index + 1];
    if (!EXECUTABLE_STEP_TYPES.has(type)) {
      unsupported.push({ path: currentPath, type: type || '(empty)' });
    }
    const children = Array.isArray(step.children)
      ? step.children
      : (Array.isArray(step.params?.children) ? step.params.children : null);
    if (children) unsupported.push(...findUnsupportedSteps(children, currentPath));
    const elseChildren = Array.isArray(step.elseChildren)
      ? step.elseChildren
      : (Array.isArray(step.params?.elseChildren) ? step.params.elseChildren : null);
    if (elseChildren) unsupported.push(...findUnsupportedSteps(elseChildren, currentPath));
    const errorChildren = Array.isArray(step.errorChildren)
      ? step.errorChildren
      : (Array.isArray(step.params?.errorChildren) ? step.params.errorChildren : null);
    if (errorChildren) unsupported.push(...findUnsupportedSteps(errorChildren, currentPath));
  }
  return unsupported;
}

/**
 * Resolve the per-character delay window for text entry.
 *
 * Human-paced entry uses a short, tight band; a plain run is still jittered so
 * that repeated entries never share an identical rhythm. Explicit bounds from
 * the step always win.
 */
function inputDelayRange(params, human) {
  const min = Number(params.minDelay);
  const max = Number(params.maxDelay);
  const lo = Number.isFinite(min) && min >= 0 ? min : (human ? 30 : 60);
  const hi = Number.isFinite(max) && max >= lo ? max : Math.max(lo, human ? 120 : 220);
  return [lo, hi];
}

function randomBetween(min, max) {
  return randomNum(min, max);
}

function interpolate(value, variables = {}) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([^}]+)\}/g, (_, key) => {
    const result = variables[String(key).trim()];
    return result == null ? '' : String(result);
  });
}

function getVariableValue(value, variables = {}) {
  if (Array.isArray(value)) return value.map((item) => getVariableValue(item, variables));
  if (typeof value !== 'string') return value;
  const match = value.match(/^\$\{([^}]+)\}$/);
  return match ? variables[match[1].trim()] : interpolate(value, variables);
}

function defaultRpaLogPath(userDataPath = null) {
  if (process.env.OPENBROWSER_RPA_LOG) return String(process.env.OPENBROWSER_RPA_LOG);
  if (userDataPath) return path.join(userDataPath, 'logs', 'rpa-automation.log');
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'openbrowser', 'logs', 'rpa-automation.log');
  }
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(base, 'openbrowser', 'logs', 'rpa-automation.log');
  }
  return path.join(os.homedir(), '.config', 'openbrowser', 'logs', 'rpa-automation.log');
}

function compactError(error) {
  const message = String(error?.message || error || 'Unknown RPA error');
  return {
    name: error?.name || 'Error',
    message,
    stack: String(error?.stack || '').split(/\r?\n/).slice(0, 12).join('\n'),
  };
}

function formatRpaError(error) {
  const message = String(error?.message || error || 'Unknown RPA error');
  if (message.includes(CDP_AUTOMATION_BLOCKED)) {
    return [
      '当前浏览器内核拒绝 CDP/RPA 自动化（独立内核未就绪或策略不匹配）。请使用安装包内置 kernels/windows-x64 并清理 userData 过期内核。',
      '请改用支持本地 CDP 自动化的内核，或在本机浏览器回退中手动选择 Chrome/Edge 后再运行自动脚本。',
    ].join(' ');
  }
  return message;
}


class BreakLoopSignal extends Error {
  constructor(message = 'breakLoop') {
    super(message);
    this.name = 'BreakLoopSignal';
  }
}

/**
 * Whole-task time budget. 0 (default) means unlimited and preserves the
 * historical behaviour; operators can bound runaway tasks globally via
 * OPENBROWSER_RPA_TASK_TIMEOUT_MS or per run via options.timeout_ms.
 */
function resolveTaskTimeoutMs(options = {}) {
  const fromOptions = Number(options?.timeout_ms ?? options?.timeoutMs);
  if (Number.isFinite(fromOptions) && fromOptions > 0) {
    return Math.min(24 * 60 * 60 * 1000, Math.floor(fromOptions));
  }
  const fromEnv = Number(process.env.OPENBROWSER_RPA_TASK_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.min(24 * 60 * 60 * 1000, Math.floor(fromEnv));
  }
  return 0;
}

function resolveSerial(params = {}) {
  if (params.serialType === 'randomInterval' || params.serialType === 'random') {
    const min = Number(params.serialMin) || 1;
    const max = Number(params.serialMax) || 1;
    return randomBetween(min, max);
  }
  const val = Number(params.serial);
  return Number.isFinite(val) && val > 0 ? Math.floor(val) : 1;
}

function resolveElementTarget(params = {}, variables = {}) {
  let selector = '';
  let selectorRadio = params.selectorRadio || 'CSS';
  if (params.selectorType === 'element' && params.element) {
    const stored = variables[params.element];
    if (typeof stored === 'string') {
      selector = stored;
    } else if (stored && typeof stored === 'object') {
      selector = stored.selector || '';
      if (stored.selectorRadio) selectorRadio = stored.selectorRadio;
    }
  } else {
    selector = String(params.selector || '');
    if (!selector && params.element && variables[params.element]) {
      const stored = variables[params.element];
      if (typeof stored === 'string') {
        selector = stored;
      } else if (stored && typeof stored === 'object') {
        selector = stored.selector || '';
        if (stored.selectorRadio) selectorRadio = stored.selectorRadio;
      }
    }
  }
  if (selector && variables) {
    selector = interpolate(selector, variables);
  }
  const serial = resolveSerial(params);
  return { selector, selectorRadio, serial };
}

function resolveConditionValue(input, variables = {}) {
  if (Array.isArray(input)) {
    return input.map((item) => resolveConditionValue(item, variables));
  }
  if (input == null) return input;
  if (typeof input !== 'string') return input;
  const trimmed = input.trim();
  const match = trimmed.match(/^\$\{([^}]+)\}$/);
  if (match) {
    return variables[match[1].trim()];
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;

  if (Object.prototype.hasOwnProperty.call(variables, trimmed)) {
    return variables[trimmed];
  }
  if (trimmed.includes('${')) {
    return interpolate(trimmed, variables);
  }
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return undefined;
  }
  return input;
}

/**
 * CDP-based RPA step runner for OpenBrowser.
 * Steps drive the DevTools protocol; plans and task history live in the local store.
 */
class RpaEngine {
  constructor({ engine, store, emit = () => {}, userDataPath = null, rpaLogPath = null, openConcurrency } = {}) {
    this.engine = engine;
    this.store = store;
    this.emit = emit;
    this.rpaLogPath = rpaLogPath || defaultRpaLogPath(userDataPath);
    this.running = new Map();
    this.profileStarts = new Map();
    this.openScheduler = new TaskScheduler({
      name: 'rpa-open',
      concurrency: resolveOpenConcurrency(openConcurrency),
    });
    // Paces the plan step loops (post-start), keeping them off the CDP pool's
    // overflow path on multi-profile plans.
    this.taskBodyScheduler = new TaskScheduler({
      name: 'rpa-task-body',
      concurrency: 8,
    });
    this.cancelled = new Set();
    this.queued = new Set();
    this.stopGeneration = 0;
    // Serializes writeDiagnostic's append/truncate pairs (see writeDiagnostic).
    this._diagnosticQueue = Promise.resolve();
  }

  writeDiagnostic(record) {
    if (!this.rpaLogPath) return Promise.resolve();
    // Serialize through a queue: concurrent task completions both appended,
    // then both read the over-limit file and each wrote back their own tail
    // computed from pre-truncate content — one of the two writes was lost.
    // The chain also keeps the truncate read-modify-write off other appends.
    const run = async () => {
      try {
        await fs.mkdir(path.dirname(this.rpaLogPath), { recursive: true });
        const line = JSON.stringify({ at: new Date().toISOString(), ...record }) + '\n';
        await fs.appendFile(this.rpaLogPath, line, 'utf8');
        const stat = await fs.stat(this.rpaLogPath);
        if (stat.size > RPA_DIAGNOSTIC_LIMIT) {
          const content = await fs.readFile(this.rpaLogPath, 'utf8');
          await fs.writeFile(this.rpaLogPath, content.slice(-Math.floor(RPA_DIAGNOSTIC_LIMIT / 2)), 'utf8');
        }
      } catch (_) {}
    };
    const queued = this._diagnosticQueue.then(run, run);
    this._diagnosticQueue = queued.then(() => {}, () => {});
    return queued;
  }

  getStatus() {
    return {
      running: [...this.running.keys()],
      count: this.running.size,
      queued: [...this.queued],
      queuedCount: this.queued.size,
    };
  }

  async stop(taskId) {
    // Honest cancel semantics: we only REQUEST cancellation here. The task
    // stays in `running` until its step loop / long-step polls observe the
    // flag and the runTask finally block performs the actual cleanup, so
    // getStatus() never under-reports work that is still executing.
    if (taskId) {
      const active = this.running.has(taskId) || this.queued.has(taskId);
      if (active) this.cancelled.add(taskId);
      return { success: true, taskId, state: active ? 'cancelling' : 'not-running' };
    }
    this.stopGeneration += 1;
    const ids = new Set([...this.running.keys(), ...this.queued]);
    for (const id of ids) this.cancelled.add(id);
    // Await actual termination (bounded 2.5s, 250ms polls like stepWait): this
    // all-tasks stop runs inside the quit chain BEFORE rpaStore.flush()
    // (automation/index.js stop()); the old request-only return let tasks
    // observe cancellation at their next step boundary and land their terminal
    // status update after that flush — rpa-store.json kept status:'running'
    // for tasks cancelled at quit, so the UI/status API reported phantom
    // running tasks on next launch. Once the maps drain, the terminal
    // store.updateTask (default save:true, awaited before the finally
    // deletes this.running) has already persisted, so the later flush is a
    // no-op safety net rather than the only writer. The cap keeps a genuinely
    // stuck in-flight CDP step from wedging the quit chain: past it the tasks
    // are left to their own step-boundary observation and only a warning is
    // emitted.
    const drainDeadline = Date.now() + 2500;
    while ((this.running.size || this.queued.size) && Date.now() < drainDeadline) {
      await sleep(250);
    }
    if (this.running.size || this.queued.size) {
      console.warn('[rpa] stop(): ' + (this.running.size + this.queued.size) + ' task(s) still in flight after 2.5s drain; proceeding with stop (step-boundary cancellation will persist their terminal state)');
    }
    return { success: true, stoppedAll: true, count: ids.size };
  }

  async runPlan(planId, options = {}) {
    const generation = this.stopGeneration;
    const plan = this.store.getPlan(planId);
    if (!plan) throw new Error('RPA plan not found: ' + planId);
    const profileIds = Array.isArray(options.profile_ids) && options.profile_ids.length
      ? options.profile_ids.map(String)
      : (plan.profile_ids || []);
    if (!profileIds.length) throw new Error('No profile_ids on plan');

    const planVariables = plan.variables && typeof plan.variables === 'object' && !Array.isArray(plan.variables)
      ? plan.variables
      : {};
    const clonePlanVariables = () => {
      const copy = {};
      for (const [key, value] of Object.entries(planVariables)) copy[key] = cloneVariableValue(value ?? '');
      return copy;
    };
    const tasks = typeof this.store.createTasks === 'function'
      ? await this.store.createTasks(profileIds.map((profileId) => ({
        plan_id: plan.id,
        profile_id: profileId,
        process_name: plan.process_name || plan.plan_name,
        steps: plan.steps,
        process_content: plan.process_content || null,
        variables: clonePlanVariables(),
      })))
      : await Promise.all(profileIds.map((profileId) => this.store.createTask({
        plan_id: plan.id,
        profile_id: profileId,
        process_name: plan.process_name || plan.plan_name,
        steps: plan.steps,
        process_content: plan.process_content || null,
        variables: clonePlanVariables(),
      })));
    // Cap concurrent task bodies (profile start already goes through
    // openScheduler, but the step loops themselves used to run all at once,
    // overflowing the CDP pool on multi-profile plans).
    const results = await Promise.all(tasks.map((task) => {
      this.queued.add(task.id);
      if (generation !== this.stopGeneration) this.cancelled.add(task.id);
      return this.taskBodyScheduler.schedule(() => this.runTask(task.id, options)
        .catch((error) => ({ success: false, taskId: task.id, error: error.message })))
        .finally(() => {
          this.queued.delete(task.id);
          if (!this.running.has(task.id)) this.cancelled.delete(task.id);
        });
    }));
    return { success: results.every((item) => item.success), results };
  }

  async runTask(taskId, options = {}) {
    const task = this.store.getTask(taskId);
    if (!task) throw new Error('RPA task not found: ' + taskId);
    if (this.running.has(taskId)) throw new Error('Task already running: ' + taskId);

    this.running.set(taskId, { startedAt: Date.now() });
    if (!this.queued.delete(taskId)) this.cancelled.delete(taskId);

    const logs = [];
    const log = async (message, level = 'info') => {
      const entry = { time: new Date().toISOString(), level, message: String(message) };
      logs.push(entry);
      // Log events remain live in the UI; persist the completed task once,
      // rather than rewriting the complete JSON store after every step.
      await this.store.updateTask(taskId, { process_logs: logs }, { save: false });
      this.emit({ type: 'rpa-log', taskId, ...entry });
    };

    let context = null;
    try {
      if (this.cancelled.has(taskId)) throw new Error('cancelled');
      await this.store.updateTask(taskId, { status: 'running', start_time: new Date().toISOString(), process_logs: [] }, { save: false });
      this.emit({ type: 'rpa-task', taskId, status: 'running', profileId: task.profile_id });
      await this.writeDiagnostic({
        type: 'rpa-task-start', taskId, planId: task.plan_id || null,
        profileId: task.profile_id, processName: task.process_name || null,
      });
      if (this.cancelled.has(taskId)) throw new Error('cancelled');
      const entry = await this.ensureProfileRunning(task.profile_id, { log });
      const port = entry.port;
      // process_content task field or steps array
      let steps = Array.isArray(task.steps) ? task.steps : [];
      if ((!steps.length) && task.process_content) {
        steps = parseProcessContent(task.process_content);
      } else if (typeof task.steps === 'string') {
        steps = parseProcessContent(task.steps);
      }
      await log(`start task on profile ${task.profile_id}, steps=${steps.length}`);

      context = {
        log,
        options,
        variables: this.initialVariables(task),
        task,
        remarks: [],
        port,
        activeProfileId: task.profile_id,
        // Steps that target "the page" must operate on the tab the flow is
        // actually on: withPage used firstTab unconditionally, so after a
        // newtab/switchpage every later click/read hit the original tab.
        activeTabId: null,
        isCancelled: () => this.cancelled.has(taskId),
      };
      // Optional task-level budget: OPENBROWSER_RPA_TASK_TIMEOUT_MS (or a
      // per-run options.timeout_ms) bounds the whole task; 0 disables it.
      const taskTimeoutMs = resolveTaskTimeoutMs(options);
      const taskDeadline = taskTimeoutMs > 0 ? Date.now() + taskTimeoutMs : 0;
      // Expose the deadline on the context so a long single step (getOpenAI)
      // can bound itself with the same task budget.
      context.taskDeadline = taskDeadline;
      const ensureTaskAlive = () => {
        if (this.cancelled.has(taskId)) throw new Error('cancelled');
        if (taskDeadline && Date.now() > taskDeadline) {
          throw new Error(`task timeout exceeded: over ${Math.round(taskTimeoutMs / 1000)}s (OPENBROWSER_RPA_TASK_TIMEOUT_MS / options.timeout_ms)`);
        }
      };
      for (let index = 0; index < steps.length; index += 1) {
        ensureTaskAlive();
        const step = steps[index] || {};
        const type = String(step.type || step.action || '').toLowerCase();
        await log(`step ${index + 1}/${steps.length}: ${type}`);
        try {
          await this.executeStep(port, step, context);
        } catch (stepErr) {
          if (stepErr instanceof BreakLoopSignal) {
            await log('task received break signal at top level; exiting flow');
            break;
          }
          throw stepErr;
        }
      }

      ensureTaskAlive();
      const snapshot = snapshotVariables(context.variables);
      const result = {
        ok: true,
        steps: steps.length,
        remarks: context.remarks.map((remark) => capResultString(String(remark))),
        variables: snapshot,
      };
      // Opt-in export channel: variableOperation(type=export) collects __exported.
      if (Object.prototype.hasOwnProperty.call(snapshot, '__exported')) {
        result.exports = snapshot.__exported;
      }
      await this.store.updateTask(taskId, {
        status: 'success',
        complete_time: new Date().toISOString(),
        process_result: result,
        process_logs: logs,
      });
      await this.writeDiagnostic({
        type: 'rpa-task-success',
        taskId,
        planId: task.plan_id || null,
        profileId: task.profile_id,
        steps: steps.length,
      });
      this.emit({ type: 'rpa-task', taskId, status: 'success', profileId: task.profile_id });
      return { success: true, taskId, result };
    } catch (error) {
      const status = this.cancelled.has(taskId) ? 'cancelled' : 'failed';
      const message = formatRpaError(error);
      await log(message, status === 'failed' ? 'error' : 'info').catch(() => {});
      await this.writeDiagnostic({
        type: 'rpa-task-' + status,
        taskId,
        planId: task.plan_id || null,
        profileId: task.profile_id,
        processName: task.process_name || null,
        error: message,
        rawError: compactError(error),
      });
      // Values collected before the failure are still returned, mirroring the
      // success path; context stays null when the profile never started.
      const failureResult = { ok: false, error: message };
      if (context) {
        failureResult.remarks = context.remarks.map((remark) => capResultString(String(remark)));
        failureResult.variables = snapshotVariables(context.variables);
      }
      await this.store.updateTask(taskId, {
        status,
        complete_time: new Date().toISOString(),
        process_result: failureResult,
        process_logs: logs,
      });
      this.emit({ type: 'rpa-task', taskId, status, profileId: task.profile_id, message });
      return { success: false, taskId, error: message, status, result: failureResult };
    } finally {
      this.running.delete(taskId);
      this.cancelled.delete(taskId);
    }
  }

  async ensureProfileRunning(profileId, { log } = {}) {
    const id = String(profileId || '').trim();
    if (!id) throw new Error('RPA task missing profile_id');
    const current = this.engine?.running?.get?.(id);
    if (current?.port) return current;
    // RPA drives browsers through CDP; Firefox kernels cannot serve it.
    const engineFamily = (current?.engine)
      || (this.engine?.profileEngine ? this.engine.profileEngine(this.engine?.profiles?.get?.(id)) : null);
    if (current && current.engine === 'firefox') {
      throw new Error('RPA 需要支持 CDP 的 Chromium 内核；Firefox 环境无法执行自动化步骤: ' + id);
    }
    if (!current && engineFamily === 'firefox') {
      throw new Error('RPA 需要支持 CDP 的 Chromium 内核；该环境已设置为 Firefox，无法执行自动化步骤: ' + id);
    }

    const profile = this.engine?.profiles?.get?.(id);
    if (!profile) throw new Error('Profile not found for RPA task: ' + id);
    if (typeof this.engine?.start !== 'function') {
      throw new Error('Profile is not running and engine.start is unavailable: ' + id);
    }

    let startPromise = this.profileStarts.get(id);
    if (!startPromise) {
      // Publish the barrier before logging can yield or re-enter this method.
      startPromise = Promise.resolve().then(async () => {
        if (log) await log('profile is not running; starting before RPA: ' + id);
        return this.openScheduler.schedule(() => this.engine.start(profile), undefined, { stepName: 'open' });
      }).finally(() => {
        if (this.profileStarts.get(id) === startPromise) this.profileStarts.delete(id);
      });
      this.profileStarts.set(id, startPromise);
    } else if (log) {
      await log('profile start already in progress; waiting before RPA: ' + id);
    }

    const started = await startPromise;
    const entry = this.engine.running?.get?.(id) || started;
    if (!entry?.port) throw new Error('Profile started but has no CDP port: ' + id);
    return entry;
  }

  async executeStep(port, step, ctx) {
    try {
      await this.executeStepInternal(port, step, ctx);
    } catch (error) {
      if (error instanceof BreakLoopSignal || error instanceof TypingAbortedError) {
        throw error;
      }
      const errorChildren = Array.isArray(step.errorChildren)
        ? step.errorChildren
        : (Array.isArray(step.params?.errorChildren) ? step.params.errorChildren : null);
      if (Array.isArray(errorChildren) && errorChildren.length > 0) {
        if (ctx?.log) await ctx.log(`step error handled by errorChildren: ${error.message}`);
        for (const child of errorChildren) {
          await this.executeStep(port, child, ctx);
        }
        return;
      }
      throw error;
    }
  }

  async executeStepInternal(port, step, ctx) {
    port = ctx?.port || port;
    const type = String(step.type || step.action || '').toLowerCase();
    const rawParams = step.params && typeof step.params === 'object' ? step.params : step;
    const params = rawParams.config && typeof rawParams.config === 'object' ? rawParams.config : rawParams;
    const variables = ctx.variables || (ctx.variables = {});
    const value = (input) => getVariableValue(input, variables);
    const text = (input) => String(value(input) ?? '');

    // Lookup-table dispatch: STEP_TYPE_ALIASES folds the 82 executable type
    // names onto the 47 canonical executors of STEP_HANDLERS (both at module
    // scope), replacing the if/else chain that used to live here. Handlers are
    // RpaEngine methods receiving everything the chain closures captured,
    // including the caller's original `type`; a miss takes the exact default
    // path the chain used to fall through to.
    const canonicalType = Object.prototype.hasOwnProperty.call(STEP_TYPE_ALIASES, type)
      ? STEP_TYPE_ALIASES[type]
      : type;
    const handlerName = Object.prototype.hasOwnProperty.call(STEP_HANDLERS, canonicalType)
      ? STEP_HANDLERS[canonicalType]
      : null;
    if (handlerName) {
      await this[handlerName]({ port, step, ctx, type, params, variables, value, text });
      return;
    }
    if (!type) return;
    throw new Error('Unsupported RPA step type: ' + type);
  }

  async stepWait({ params, ctx }) {
    let ms = Number(params.ms ?? params.timeout ?? params.time ?? 1000);
    if (params.timeoutType === 'randomInterval' || params.timeoutType === 'random') {
      ms = randomBetween(params.timeoutMin ?? params.minMs ?? 300, params.timeoutMax ?? params.maxMs ?? 800);
    }
    ms = Math.max(0, Math.min(120000, ms || 1000));
    // Slice the sleep so stop(taskId) takes effect within ~250ms instead of
    // after the full 120s cap.
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      if (ctx?.isCancelled?.()) throw new Error('cancelled');
      await sleep(Math.min(250, Math.max(0, deadline - Date.now())));
    }
    return;
  }

  async stepGoto({ port, params, text }) {
    const url = text(params.url || params.href || 'about:blank');
    await cdp.navigate(port, url);
    return;
  }

  async stepReload({ port }) {
    await cdp.reload(port);
    return;
  }

  async stepNewTab({ port, ctx, params, text }) {
    const created = await cdp.newTab(port, text(params.url || 'about:blank'));
    if (created?.id) ctx.activeTabId = created.id;
    return;
  }

  async stepCloseTab({ port, ctx }) {
    // Close the tab the flow is on, not whatever firstTab happens to
    // return; fall back to firstTab for flows that never opened one.
    const tab = (ctx.activeTabId && (await cdp.tabs(port)).find((item) => item.id === ctx.activeTabId))
      || await cdp.firstTab(port);
    if (tab) {
      await cdp.closeTab(port, tab.id);
      if (ctx.activeTabId === tab.id) ctx.activeTabId = null;
    }
    return;
  }

  async stepTypeText({ port, ctx, params, variables, text }) {
    const isRandom = params.isRandom === '1' || params.isRandom === 1 || params.isRandom === true;
    let inputText = '';
    if (isRandom && params.randomContent) {
      const lines = String(params.randomContent).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length > 0) {
        inputText = lines[Math.floor(Math.random() * lines.length)];
      }
    }
    if (!inputText) {
      inputText = text(params.text ?? params.value ?? params.content ?? params.randomContent ?? '');
    }
    const clear = params.clear === true || params.clear === 1 || params.clear === '1'
      || params.isClear === true || params.isClear === 1 || params.isClear === '1';
    const optional = isOptionalElementStep(params);
    const target = resolveElementTarget(params, variables);
    const selector = target.selector;

    if (clear && !selector) await cdp.clearFocused(port).catch(() => {});
    if (selector) {
      try {
        await this.withPage(port, async (ws) => {
          await this.focusSelector(ws, selector, target.selectorRadio, target.serial);
          if (clear) {
            await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 65, modifiers: 2 });
            await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 65, modifiers: 2 });
            await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: 8 });
            await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 8 });
          }
          // Every character is dispatched as a real key event sequence
          // (keydown/keyup with a Shift bracket where the layout needs one)
          // rather than written straight into the element. Pass `human` to
          // add slip-and-correct behaviour on top of the key timing.
          const humanTyping = Boolean(params.human || params.intervals);
          await humanInput.typeText(cdp, ws, inputText, {
            human: humanTyping,
            delayRange: inputDelayRange(params, humanTyping),
            typoConfig: params.typoConfig,
            shouldAbort: () => Boolean(ctx?.isCancelled?.()),
          });
        }, ctx);
      } catch (error) {
        if (optional && isMissingElementError(error)) {
          if (ctx?.log) await ctx.log('optional input skipped (not found): ' + selector);
          return;
        }
        throw error;
      }
    } else {
      const focused = await cdp.focusedEditableTab(port);
      if (!focused) throw new Error('No focused text input was found in the visible tab');
      const humanTyping = Boolean(params.human || params.intervals);
      await humanInput.typeText(cdp, focused.tab.webSocketDebuggerUrl, inputText, {
        human: humanTyping,
        delayRange: inputDelayRange(params, humanTyping),
        typoConfig: params.typoConfig,
        shouldAbort: () => Boolean(ctx?.isCancelled?.()),
      });
    }
    return;
  }

  async stepClick({ port, ctx, params, variables }) {
    const optional = isOptionalElementStep(params);
    const target = resolveElementTarget(params, variables);
    await this.withPage(port, async (ws) => {
      if (target.selector) {
        const box = await this.boundingBox(ws, target.selector, target.selectorRadio, target.serial);
        if (!box) {
          if (optional) {
            if (ctx?.log) await ctx.log('optional click skipped (not found): ' + target.selector);
            return;
          }
          throw new Error('Element not found: ' + target.selector);
        }
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        const button = params.button === 'right' ? 'right' : params.button === 'middle' ? 'middle' : 'left';
        const clickCount = params.type === 'dblclick' ? 2 : 1;
        await cdp.call(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await cdp.call(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount });
        await cdp.call(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount });
      } else if (Number.isFinite(Number(params.x)) && Number.isFinite(Number(params.y))) {
        const x = Number(params.x);
        const y = Number(params.y);
        const button = params.button === 'right' ? 'right' : params.button === 'middle' ? 'middle' : 'left';
        const clickCount = params.type === 'dblclick' ? 2 : 1;
        await cdp.call(ws, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount });
        await cdp.call(ws, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount });
      } else {
        throw new Error('click requires selector or x/y');
      }
    }, ctx);
    return;
  }

  async stepPassingElement({ port, ctx, params, variables }) {
    const optional = isOptionalElementStep(params);
    const target = resolveElementTarget(params, variables);
    if (!target.selector) {
      if (optional) {
        if (ctx?.log) await ctx.log('optional passingElement skipped (no selector)');
        return;
      }
      throw new Error('passingElement requires selector or a stored element');
    }
    await this.withPage(port, async (ws) => {
      const box = await this.boundingBox(ws, target.selector, target.selectorRadio, target.serial);
      if (!box) {
        if (optional) {
          if (ctx?.log) await ctx.log('optional passingElement skipped (not found): ' + target.selector);
          return;
        }
        throw new Error('Element not found: ' + target.selector);
      }
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await cdp.call(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    }, ctx);
    return;
  }

  async stepSelectElement({ port, ctx, params, variables, text }) {
    const optional = isOptionalElementStep(params);
    const target = resolveElementTarget(params, variables);
    const selector = target.selector;
    const selectedValue = text(params.value);
    if (!selector) {
      if (optional) {
        if (ctx?.log) await ctx.log('optional selectElement skipped (no selector)');
        return;
      }
      throw new Error('selectElement requires selector or a stored element');
    }
    try {
      await this.withPage(port, async (ws) => {
        const call = (method, params = {}) => cdp.call(ws, method, params);
        const result = await applyTrustedChange(call, {
          selector,
          value: selectedValue,
          selectedIndex: Number.isInteger(params.selectedIndex) ? params.selectedIndex : undefined,
        });
        if (!result.ok) throw new Error('selectElement failed: ' + selector + ' (' + (result.reason || 'unknown') + ')');
      }, ctx);
    } catch (error) {
      if (optional && isMissingElementError(error)) {
        if (ctx?.log) await ctx.log('optional selectElement skipped (not found): ' + selector);
        return;
      }
      throw error;
    }
    return;
  }

  async stepWaitForSelector({ port, ctx, params, variables }) {
    const target = resolveElementTarget(params, variables);
    const selector = target.selector;
    if (!selector) throw new Error('waitForSelector requires selector');
    const timeout = Number(params.timeout) || 30000;
    const isShow = !(params.isShow === '0' || params.isShow === 0 || params.isShow === false);
    const deadline = Date.now() + timeout;
    let success = false;
    while (Date.now() < deadline) {
      if (ctx?.isCancelled?.()) throw new Error('cancelled');
      const found = await this.withPage(port, async (ws) => {
        try {
          // Pure existence probe: focusSelector would steal focus and
          // scrollIntoView every 200ms, changing the page we are waiting on.
          await this.probeSelector(ws, selector, target.selectorRadio, target.serial);
          return true;
        } catch (_) { return false; }
      }, ctx);
      if (isShow ? found : !found) {
        success = true;
        break;
      }
      await sleep(200);
    }
    if (params.variable) {
      variables[params.variable] = success;
    }
    if (!success && !params.variable && !isOptionalElementStep(params)) {
      throw new Error('waitForSelector timeout: ' + selector);
    }
    return;
  }

  async stepForTimes({ port, step, ctx, params, variables, value }) {
    const times = Math.max(0, Math.min(1000, Number(value(params.times)) || 1));
    const children = Array.isArray(step.children) ? step.children : (Array.isArray(params.children) ? params.children : []);
    try {
      for (let i = 0; i < times; i += 1) {
        if (params.variableIndex) variables[params.variableIndex] = i;
        for (const child of children) await this.executeStep(port, child, ctx);
      }
    } catch (err) {
      if (err instanceof BreakLoopSignal) return;
      throw err;
    }
    return;
  }

  async stepCombineProcess({ port, step, ctx, params }) {
    const children = Array.isArray(step.children) ? step.children : (Array.isArray(params.children) ? params.children : []);
    for (const child of children) await this.executeStep(port, child, ctx);
    return;
  }

  async stepForLists({ port, step, ctx, params, variables, value }) {
    const list = value(params.content);
    let items = Array.isArray(list) ? list : [];
    if (!items.length && typeof list === 'string') {
      try { items = JSON.parse(list); } catch (_) { items = list.split(/\r?\n/).filter(Boolean); }
    }
    if (!Array.isArray(items)) throw new Error('forLists requires an array variable: ' + String(params.content || ''));
    const children = Array.isArray(step.children) ? step.children : (Array.isArray(params.children) ? params.children : []);
    try {
      for (let index = 0; index < items.length; index += 1) {
        variables[params.variable || 'item'] = items[index];
        if (params.variableIndex) variables[params.variableIndex] = index;
        for (const child of children) await this.executeStep(port, child, ctx);
      }
    } catch (err) {
      if (err instanceof BreakLoopSignal) return;
      throw err;
    }
    return;
  }

  async stepIfElse({ port, step, ctx, params, variables }) {
    const condition = this.evaluateCondition(params, variables);
    const children = Array.isArray(step.children) ? step.children : (Array.isArray(params.children) ? params.children : []);
    const elseChildren = Array.isArray(step.elseChildren) ? step.elseChildren : (Array.isArray(params.elseChildren) ? params.elseChildren : []);
    if (!condition) {
      for (const child of elseChildren) await this.executeStep(port, child, ctx);
    } else {
      for (const child of children) await this.executeStep(port, child, ctx);
    }
    return;
  }

  async stepWhileData({ port, step, ctx, params, variables }) {
    const max = Math.max(1, Math.min(10000, Number(params.maxLoops || 100)));
    const children = Array.isArray(step.children) ? step.children : (Array.isArray(params.children) ? params.children : []);
    try {
      for (let count = 0; count < max && this.evaluateCondition(params, variables); count += 1) {
        for (const child of children) await this.executeStep(port, child, ctx);
      }
    } catch (err) {
      if (err instanceof BreakLoopSignal) return;
      throw err;
    }
    return;
  }

  async stepFocusElement({ port, ctx, params, variables }) {
    const optional = isOptionalElementStep(params);
    const target = resolveElementTarget(params, variables);
    if (!target.selector) {
      if (optional) {
        if (ctx?.log) await ctx.log('optional focusElement skipped (no selector)');
        return;
      }
      throw new Error('focusElement requires selector or a stored element');
    }
    try {
      await this.withPage(port, (ws) => this.focusSelector(ws, target.selector, target.selectorRadio, target.serial), ctx);
    } catch (error) {
      if (optional && isMissingElementError(error)) {
        if (ctx?.log) await ctx.log('optional focus skipped: ' + target.selector);
        return;
      }
      throw error;
    }
    return;
  }

  async stepGetElement({ port, ctx, params, variables }) {
    const optional = isOptionalElementStep(params);
    const target = resolveElementTarget(params, variables);
    if (!target.selector) {
      if (optional) {
        if (ctx?.log) await ctx.log('optional getElement skipped (no selector)');
        if (params.variable) variables[params.variable] = null;
        return;
      }
      throw new Error('getElement requires selector or a stored element');
    }
    const result = await this.withPage(port, async (ws) => this.readElement(ws, target.selector, params, target.serial), ctx);
    if (result == null) {
      if (optional) {
        if (ctx?.log) await ctx.log('optional getElement skipped (not found): ' + target.selector);
        if (params.variable) variables[params.variable] = null;
        return;
      }
      throw new Error('Element not found: ' + target.selector);
    }
    if (params.variable) variables[params.variable] = result;
    return;
  }

  async stepForElements({ port, step, ctx, params, variables }) {
    const target = resolveElementTarget(params, variables);
    const selector = target.selector;
    if (!selector) throw new Error('forElements requires selector');
    const elements = await this.withPage(port, (ws) => this.listElements(ws, selector, params), ctx);
    const children = Array.isArray(step.children) ? step.children : (Array.isArray(params.children) ? params.children : []);
    try {
      for (let index = 0; index < elements.length; index += 1) {
        variables[params.variable || 'element'] = elements[index];
        if (params.variableIndex) variables[params.variableIndex] = index;
        for (const child of children) await this.executeStep(port, child, ctx);
      }
    } catch (err) {
      if (err instanceof BreakLoopSignal) return;
      throw err;
    }
    return;
  }

  async stepToJson({ type, params, variables, value }) {
    const source = value(params.content);
    let result = source;
    if (type === 'tojson') {
      try { result = typeof source === 'string' ? JSON.parse(source) : source; } catch (error) { throw new Error('toJson failed: ' + error.message); }
    } else if (type === 'extractkey') {
      const object = typeof source === 'string' ? JSON.parse(source) : source;
      result = params.key ? String(params.key).split('.').reduce((item, key) => item?.[key], object) : object;
    } else {
      const sourceText = String(source ?? '');
      const match = new RegExp(String(params.reg || ''), params.notUpper ? '' : 'i').exec(sourceText);
      result = match ? (params.onlyGetFirst ? match[1] || match[0] : match[0]) : '';
    }
    if (params.variable) variables[params.variable] = result;
    return;
  }

  async stepSaveData({ ctx, params, text }) {
    const filename = this.outputPath(text(params.name || 'data'), '.txt');
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.appendFile(filename, text(params.template ?? params.content ?? '') + '\n', 'utf8');
    if (ctx?.log) await ctx.log('saved data: ' + filename);
    return;
  }

  async stepExportExcel({ ctx, params, variables, text }) {
    const records = this.exportRecords(params, variables);
    const fields = Array.isArray(params.fields) && params.fields.length
      ? params.fields.map(String)
      : [...new Set(records.flatMap((record) => Object.keys(record || {})))];
    const csv = [fields, ...records.map((record) => fields.map((field) => record?.[field] ?? ''))]
      .map((row) => row.map((cell) => this.csvCell(cell)).join(','))
      .join('\n') + '\n';
    const filename = this.outputPath(text(params.name || 'export'), '.csv');
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, csv, 'utf8');
    if (ctx?.log) await ctx.log('exported CSV: ' + filename);
    return;
  }

  async stepSaveRemark({ ctx, params, text }) {
    const remark = text(params.content ?? params.remark ?? '');
    ctx.remarks.push(remark);
    if (ctx?.log) await ctx.log('remark: ' + remark);
    return;
  }

  async stepVariableOperation({ params, variables }) {
    const opType = String(params.type || '').toLowerCase();
    const fields = Array.isArray(params.fields) ? params.fields.map(String) : [];
    if (opType === 'export') {
      variables.__exported = Object.fromEntries(fields.map((field) => [field, variables[field]]));
    } else if (opType === 'add' || opType === 'set') {
      const list = Array.isArray(params.variableObjList) ? params.variableObjList : [];
      for (const item of list) {
        if (!item || !item.key) continue;
        let val = getVariableValue(item.value, variables);
        if (item.type === 'number') {
          const num = Number(val);
          val = Number.isFinite(num) ? num : val;
        }
        variables[String(item.key).trim()] = val;
      }
    }
    return;
  }

  async stepUseExcel({ ctx, params, variables, text }) {
    const targetVar = params.variable || 'data';
    const skippable = (
      params.isSkip === true
      || params.isSkip === 1
      || params.isSkip === '1'
      || params.isSkip === 'true'
      || params.optional === true
      || params.optional === '1'
      || params.optional === 'true'
    );
    let filePath = text(
      params.path
      ?? params.filePath
      ?? params.file
      ?? params.dataExcelPath
      ?? params.excelPath
      ?? params.content
    ).trim();
    if (!filePath || /\$\{[^}]+\}/.test(filePath)) {
      if (!skippable) {
        throw new Error(
          filePath
            ? 'useExcel path is unresolved (' + filePath + '); set the template variable to a local CSV/JSON file'
            : 'useExcel requires a CSV or JSON file path'
        );
      }
      variables[targetVar] = [];
      if (ctx?.log) {
        await ctx.log('useExcel skipped: no spreadsheet path configured (set a CSV/JSON path in template variables)');
      }
      return;
    }

    let safePath;
    try {
      safePath = await this.resolveSpreadsheetPath(filePath);
    } catch (error) {
      if (skippable) {
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: ' + error.message);
        return;
      }
      throw error;
    }

    const extension = path.extname(safePath).toLowerCase();
    if (extension === '.xlsx' || extension === '.xls') {
      const message = 'useExcel does not read .xlsx/.xls yet; convert to .csv or .json and set the path variable';
      if (skippable) {
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: ' + message);
        return;
      }
      throw new Error(message);
    }
    if (extension !== '.csv' && extension !== '.json') {
      const message = 'useExcel currently accepts .csv or .json (got ' + extension + ')';
      if (skippable) {
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: ' + message);
        return;
      }
      throw new Error(message);
    }

    let raw;
    try {
      raw = await fs.readFile(safePath, 'utf8');
    } catch (_error) {
      if (skippable) {
        variables[targetVar] = [];
        if (ctx?.log) await ctx.log('useExcel skipped: cannot read file ' + safePath);
        return;
      }
      throw new Error('useExcel cannot read file: ' + safePath);
    }

    let records;
    if (extension === '.json') {
      try {
        records = JSON.parse(raw);
      } catch (error) {
        // Same class of bad input as an unreadable file: skip when allowed
        // rather than failing the whole task with a raw SyntaxError.
        if (skippable) {
          variables[targetVar] = [];
          if (ctx?.log) await ctx.log('useExcel skipped: cannot parse JSON ' + safePath + ' (' + error.message + ')');
          return;
        }
        throw new Error('useExcel cannot parse JSON: ' + error.message);
      }
    } else {
      const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
      if (!lines.length) {
        variables[targetVar] = [];
        return;
      }
      const headers = splitCsvLine(lines[0]).map((item) => item.trim());
      records = lines.slice(1).map((row) => Object.fromEntries(
        splitCsvLine(row).map((item, index) => [headers[index] || ('col' + index), item.trim()])
      ));
    }
    if (!Array.isArray(records)) throw new Error('useExcel JSON content must be an array');
    variables[targetVar] = records;
    if (ctx?.log) await ctx.log(`useExcel loaded ${records.length} row(s) from ${safePath}`);
    return;
  }

  async stepImportText({ params, variables, text }) {
    const filePath = text(params.path || params.filePath || params.file);
    if (!filePath) throw new Error('importText requires a file path');
    const resolved = resolveSafeRpaPath(filePath);
    const raw = await fs.readFile(resolved, 'utf8');
    const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
    variables[params.variable || 'textLines'] = lines;
    return;
  }

  async stepRandomGet({ params, variables }) {
    const source = getVariableValue(params.variable || params.list || params.content, variables);
    const list = Array.isArray(source)
      ? source
      : String(source == null ? '' : source).split(/\r?\n/).filter((item) => item.length > 0);
    if (!list.length) {
      variables[params.saveVariable || params.target || 'randomItem'] = '';
      return;
    }
    const pick = list[Math.floor(Math.random() * list.length)];
    variables[params.saveVariable || params.target || params.variable || 'randomItem'] = pick;
    return;
  }

  async stepGet2FACode({ ctx, params, variables, text }) {
    const code = text(params.code || params.content || variables[params.variable || 'otp'] || '');
    variables[params.saveVariable || params.variable || 'otpCode'] = code;
    if (!code && ctx?.log) await ctx.log('get2faCode: no code provided in variables/params');
    return;
  }

  async stepGoogleSheet({ ctx, params, variables }) {
    const sheet = variables[params.variable || 'sheetData'];
    if (sheet == null) {
      if (ctx?.log) await ctx.log('googleSheet: no local sheetData variable; skipped remote Google API');
      variables[params.saveVariable || params.variable || 'sheetData'] = [];
    }
    return;
  }

  async stepGetCookies({ port, ctx, params, variables }) {
    const cookies = await this.withPage(port, (ws) => cdp.call(ws, 'Network.getCookies', {}), ctx);
    variables[params.variable || 'cookies'] = cookies?.cookies || cookies || [];
    return;
  }

  async stepGetClipboard({ type, params, variables }) {
    variables[params.variable || type] = variables[params.variable || type] || '';
    return;
  }

  async stepBestEffortNoop({ ctx, type }) {
    if (ctx?.log) await ctx.log(`${type}: best-effort no-op in current runtime`);
    return;
  }

  async stepGoBack({ port, params }) {
    // cdp.call's 4th argument is a millisecond timeout, not a context.
    await this.withPage(port, (ws) => cdp.call(ws, 'Runtime.evaluate', {
      expression: 'history.back(); true', returnByValue: true,
    }));
    await sleep(Math.max(0, Math.min(30000, Number(params.timeout) || 500)));
    return;
  }

  async stepSwitchPage({ port, ctx, params, text }) {
    const expected = text(params.content || params.url || '');
    const relation = String(params.relation || 'contain').toLowerCase();
    const tabs = await cdp.tabs(port);
    const tab = tabs.find((candidate) => {
      const haystack = `${candidate.url || ''} ${candidate.title || ''}`;
      return relation === 'equal' ? haystack === expected : haystack.includes(expected);
    });
    if (!tab) throw new Error('switchPage target not found: ' + expected);
    await cdp.activateTab(port, tab.id);
    ctx.activeTabId = tab.id;
    return;
  }

  async stepUploadAttachment({ port, ctx, params, text }) {
    const selector = text(params.selector);
    const filePath = text(params.url || params.path);
    if (!selector || !filePath) throw new Error('uploadAttachment requires selector and local file path');
    const safePath = resolveSafeRpaPath(filePath);
    await fs.access(safePath);
    if (String(params.selectorRadio || 'CSS').toUpperCase().startsWith('X')) {
      throw new Error('uploadAttachment currently requires a CSS selector');
    }
    await this.withPage(port, async (ws) => {
      const document = await cdp.call(ws, 'DOM.getDocument', { depth: 1 });
      const node = await cdp.call(ws, 'DOM.querySelector', { nodeId: document.root.nodeId, selector });
      if (!node.nodeId) throw new Error('uploadAttachment selector not found: ' + selector);
      await cdp.call(ws, 'DOM.setFileInputFiles', { nodeId: node.nodeId, files: [safePath] });
    }, ctx);
    return;
  }

  async stepDownloadFile({ port, ctx, params, text }) {
    const url = text(params.url);
    if (!url) throw new Error('downloadFile requires url');
    const explicitName = text(params.path);
    const payload = await this.withPage(port, async (ws) => {
      // The response headers travel back with the bytes so the server can
      // name the file; `fetch` follows redirects, so this is the final name.
      const expression = `(async () => { const response = await fetch(${JSON.stringify(url)}, { credentials: 'include' }); if (!response.ok) throw new Error('HTTP ' + response.status); const bytes = new Uint8Array(await response.arrayBuffer()); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return { body: btoa(binary), disposition: response.headers.get('content-disposition') || '' }; })()`;
      const result = await cdp.call(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, 60000);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'downloadFile failed');
      return result.result?.value;
    }, ctx);
    const body = payload && typeof payload === 'object' ? payload.body : payload;
    const disposition = payload && typeof payload === 'object' ? payload.disposition : '';
    let urlExtension = '.bin';
    try { urlExtension = path.extname(new URL(url, 'https://localhost').pathname) || '.bin'; } catch (_) { urlExtension = '.bin'; }
    // An explicit path is a deliberate override and stays byte-for-byte the
    // caller's choice; without one the server-supplied name wins over the
    // URL, which beats a fixed placeholder that silently overwrote.
    const resolvedName = explicitName
      ? explicitName
      : getDownloadFileName(url, getFileNameFromContentDisposition(disposition) || '', `download-${Date.now()}`);
    const target = this.outputPath(resolvedName, urlExtension);
    await fs.mkdir(path.dirname(target), { recursive: true });
    try {
      await fs.writeFile(target, Buffer.from(String(body || ''), 'base64'));
    } catch (error) {
      // A locked destination (a spreadsheet still open elsewhere) is the
      // common failure here and deserves its own explanation.
      throw new Error(getDownloadFailureMessage(classifyTargetFileFailure(error), path.basename(target)));
    }
    return;
  }

  async stepNetworkRequest({ port, ctx, type, params, variables, text }) {
    if (type === 'stoplinsten') return;
    const matcher = text(params.url || '');
    const timeout = Math.max(0, Math.min(120000, Number(params.timeout) || 30000));
    const resource = await this.findNetworkResource(port, matcher, timeout, {
      shouldAbort: () => Boolean(ctx?.isCancelled?.()),
      ctx,
    });
    if (type === 'waitforresponse') return;
    if (type === 'getrequest') {
      const requestUrl = resource.name;
      const key = text(params.key || '');
      let result = requestUrl;
      if (String(params.type).toLowerCase() === 'getparams' && key) result = new URL(requestUrl).searchParams.get(key) || '';
      if (params.variable) variables[params.variable] = result;
      return;
    }
    const body = await this.withPage(port, async (ws) => {
      const expression = `(async () => { const response = await fetch(${JSON.stringify(resource.name)}, { credentials: 'include' }); return await response.text(); })()`;
      const result = await cdp.call(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, 30000);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'getResponse failed');
      return result.result?.value || '';
    }, ctx);
    if (params.variable) variables[params.variable] = body;
    return;
  }

  async stepGetOpenAI({ ctx, params, variables, text }) {
    const apiKey = text(params.apiKey);
    if (!apiKey) throw new Error('getOpenAI requires an apiKey variable');
    // Native fetch has no default timeout, so a hung request would stall the
    // task until it returns. Abort on the task deadline (default 60s) and on
    // cancellation; the cancelled flag is otherwise only observed between steps.
    const deadlineAt = Number(ctx?.taskDeadline) > Date.now()
      ? Number(ctx.taskDeadline)
      : Date.now() + 60000;
    const controller = new AbortController();
    let abortReason = null;
    const timeoutTimer = setTimeout(() => {
      abortReason = 'timeout';
      controller.abort();
    }, Math.max(0, deadlineAt - Date.now()));
    const cancelPoll = setInterval(() => {
      if (ctx?.isCancelled?.()) {
        abortReason = 'cancelled';
        controller.abort();
      }
    }, 500);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: text(params.type || 'gpt-4o-mini'), messages: [{ role: 'user', content: text(params.prompt) }], max_tokens: Number(params.token) || 4096 }),
        signal: controller.signal,
      });
      // Budget check after the fetch: a response that landed after the task
      // was cancelled or overran the deadline must not continue the flow.
      if (ctx?.isCancelled?.()) throw new Error('cancelled');
      if (Number(ctx?.taskDeadline) > 0 && Date.now() >= Number(ctx.taskDeadline)) {
        throw new Error('getOpenAI request timed out');
      }
      if (!response.ok) throw new Error(`getOpenAI request failed: HTTP ${response.status}`);
      const responseBody = await response.json();
      if (params.variable) variables[params.variable] = responseBody.choices?.[0]?.message?.content || '';
    } catch (error) {
      if (abortReason === 'timeout') throw new Error('getOpenAI request timed out');
      if (abortReason === 'cancelled') throw new Error('cancelled');
      throw error;
    } finally {
      clearTimeout(timeoutTimer);
      clearInterval(cancelPoll);
    }
    return;
  }

  async stepScroll({ port, ctx, params }) {
    await this.withPage(port, async (ws) => {
      const scrollType = String(params.scrollType || 'pixel').toLowerCase();
      const behavior = params.type === 'smooth' ? 'smooth' : 'auto';
      if (scrollType === 'position') {
        const position = String(params.position || 'bottom').toLowerCase();
        let scrollExpr = '';
        if (position === 'top') {
          scrollExpr = `window.scrollTo({ top: 0, left: 0, behavior: ${JSON.stringify(behavior)} })`;
        } else if (position === 'middle') {
          scrollExpr = `window.scrollTo({ top: (document.documentElement.scrollHeight || document.body.scrollHeight) / 2, behavior: ${JSON.stringify(behavior)} })`;
        } else {
          scrollExpr = `window.scrollTo({ top: (document.documentElement.scrollHeight || document.body.scrollHeight), behavior: ${JSON.stringify(behavior)} })`;
        }
        await cdp.call(ws, 'Runtime.evaluate', { expression: scrollExpr, returnByValue: true });
      } else {
        const distance = Number(params.distance ?? params.deltaY ?? params.y ?? 400);
        const deltaX = Number(params.deltaX || 0);
        await cdp.call(ws, 'Runtime.evaluate', {
          expression: `window.scrollBy({ top: ${distance}, left: ${deltaX}, behavior: ${JSON.stringify(behavior)} })`,
          returnByValue: true,
        });
        await cdp.call(ws, 'Input.dispatchMouseEvent', {
          type: 'mouseWheel',
          x: Number(params.x || 200),
          y: Number(params.y || 200),
          deltaX,
          deltaY: distance || 100,
        }).catch(() => {});
      }
    }, ctx);
    return;
  }

  async stepEvaluate({ port, ctx, params, variables, text }) {
    const expression = text(params.expression || params.code || params.script || params.content || '');
    if (!expression) throw new Error('evaluate requires expression');
    await this.withPage(port, async (ws) => {
      const names = Array.isArray(params.params) ? params.params.map(String) : [];
      const values = names.map((name) => variables[name]);
      // A cyclic variable value would make JSON.stringify throw and kill the
      // step with an unrelated TypeError; degrade to null like a snapshot.
      const serialize = (value) => { try { return JSON.stringify(value); } catch (_) { return 'null'; } };
      const wrapped = names.length
        ? `(() => { const fn = new Function(...${serialize(names)}, ${serialize(expression)}); return fn(...${serialize(values)}); })()`
        : expression;
      const result = await cdp.call(ws, 'Runtime.evaluate', {
        expression: wrapped,
        returnByValue: true,
        awaitPromise: true,
      }, 30000);
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text || 'evaluate failed');
      }
      const resultValue = result.result?.value;
      if (params.variable) variables[params.variable] = resultValue;
      // Cyclic evaluate results made JSON.stringify throw here, failing the
      // step AFTER the evaluate already succeeded; reuse the safe serializer
      // from the params wrapping above (degrades to 'null' like a snapshot).
      if (ctx?.log) await ctx.log('evaluate result: ' + serialize(resultValue));
    }, ctx);
    return;
  }

  async stepScreenshot({ port, ctx, params, variables, text }) {
    const shot = await this.withPage(port, (ws) =>
      cdp.call(ws, 'Page.captureScreenshot', { format: String(params.format || 'png') }, 15000), ctx);
    if (!shot?.data) throw new Error('screenshot failed: no image data returned');
    const format = String(params.format || 'png').toLowerCase();
    const extension = format === 'jpeg' || format === 'jpg' ? '.jpg' : format === 'webp' ? '.webp' : '.png';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = this.outputPath(text(params.name || params.path) || `screenshot-${stamp}`, extension);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, Buffer.from(String(shot.data), 'base64'));
    if (params.variable) variables[params.variable] = filename;
    if (ctx?.log) await ctx.log('screenshot saved: ' + filename);
    return;
  }

  async stepGetUrl({ port, ctx, params, variables }) {
    await this.withPage(port, async (ws) => {
      const result = await cdp.call(ws, 'Runtime.evaluate', { expression: 'location.href', returnByValue: true });
      if (params.variable) variables[params.variable] = result.result?.value || '';
      if (ctx?.log) await ctx.log('getUrl=' + result.result?.value);
    }, ctx);
    return;
  }

  async stepClearCookies({ port, ctx }) {
    await this.withPage(port, async (ws) => {
      await cdp.call(ws, 'Network.enable', {});
      await cdp.call(ws, 'Network.clearBrowserCookies', {});
    }, ctx);
    return;
  }

  async stepCloseBrowser({ ctx }) {
    if (typeof this.engine?.stop !== 'function') throw new Error('closeBrowser is unavailable: browser engine cannot stop profiles');
    await this.engine.stop(ctx.activeProfileId || ctx.task.profile_id);
    return;
  }

  async stepOpenNewBrowser({ step, ctx, params, variables, text }) {
    if (!(this.engine?.profiles instanceof Map) || typeof this.engine?.start !== 'function') {
      throw new Error('openNewBrowser is unavailable: local profile management is not configured');
    }
    const requestedNumber = Number(String(text(params.accounts || params.account || '')).split(/[\s,;]+/)[0]);
    if (!Number.isInteger(requestedNumber) || requestedNumber < 1) {
      throw new Error('openNewBrowser requires a local environment number in accounts');
    }
    const profile = [...this.engine.profiles.values()].find((item) => Number(item.number) === requestedNumber);
    if (!profile) throw new Error('openNewBrowser local environment not found: ' + requestedNumber);
    const started = await this.engine.start(profile);
    if (!started?.port) throw new Error('openNewBrowser did not return a CDP port');
    const prevPort = ctx.port;
    const prevProfileId = ctx.activeProfileId;
    ctx.port = started.port;
    ctx.activeProfileId = profile.id;
    variables.openedBrowserProfileId = profile.id;

    const children = Array.isArray(step.children) ? step.children : (Array.isArray(params.children) ? params.children : []);
    try {
      for (const child of children) {
        await this.executeStep(ctx.port, child, ctx);
      }
    } finally {
      const shouldClose = params.autoClose === true || params.autoClose === 1 || params.autoClose === '1';
      if (shouldClose && typeof this.engine?.stop === 'function') {
        await this.engine.stop(profile.id).catch(() => {});
      }
      ctx.port = prevPort;
      ctx.activeProfileId = prevProfileId;
    }
    return;
  }

  async stepBreakLoop() {
    throw new BreakLoopSignal();
  }

  async stepNoop() {
    return;
  }

  async stepKey({ port, ctx, params, text }) {
    const keyName = text(params.key || 'Enter');
    await this.withPage(port, async (ws) => {
      // Full key descriptor (code/vk/text) so printable keys actually type
      // and sites listening on event.code fire. Falls back to the bare key
      // name for anything the descriptor tables don't know.
      const descriptor = humanInput.keyDescriptor(keyName);
      if (descriptor) {
        const base = { key: keyName, code: descriptor.code, windowsVirtualKeyCode: descriptor.vk, nativeVirtualKeyCode: descriptor.vk };
        await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyDown', ...base, text: keyName, unmodifiedText: descriptor.base });
        await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyUp', ...base });
        return;
      }
      if (humanInput.isNamedKey(keyName)) {
        const base = { key: keyName, code: keyName, ...NAMED_KEY_VK(keyName) };
        await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
        await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyUp', ...base });
        return;
      }
      await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyDown', key: keyName });
      await cdp.call(ws, 'Input.dispatchKeyEvent', { type: 'keyUp', key: keyName });
    }, ctx);
    return;
  }

  initialVariables(task) {
    const variables = {};
    // Explicit plan/task variables win first (installed templates may store these without process_content).
    const explicit = task?.variables || task?.global_variables || task?.globalVariable || {};
    if (explicit && typeof explicit === 'object' && !Array.isArray(explicit)) {
      for (const [key, value] of Object.entries(explicit)) {
        // Deep-clone per task: a plan's tasks run concurrently, and a shared
        // nested object (e.g. a useExcel row array) would let one profile's
        // steps mutate another's data.
        if (key) variables[String(key)] = cloneVariableValue(value ?? '');
      }
    }
    let process = task.process_content;
    if (typeof process === 'string') {
      try { process = JSON.parse(process); } catch (_) { process = null; }
    }
    const start = process?.nodes?.find((node) => node.type === 'startNode');
    const definitions = start?.globalVariable || start?.config?.variableObjList || [];
    for (const item of definitions) {
      if (item?.key && !(String(item.key) in variables)) {
        variables[String(item.key)] = item.value ?? '';
      }
    }
    return variables;
  }

  /**
   * Resolve spreadsheet paths for useExcel.
   * Allows the RPA output dir plus the named user folders
   * (Desktop/Documents/Downloads and their OneDrive variants),
   * because catalog templates expect user-picked absolute paths.
   * The home/userProfile directory itself is deliberately NOT an allowed
   * root: isPathInsideRoot treats every path under it as inside, so allowing
   * the bare home would let useExcel read any file there (~/.ssh/id_rsa).
   * On Windows also accepts OneDrive-redirected Desktop/Documents and realpath-resolved trees.
   */
  async resolveSpreadsheetPath(filePath) {
    const raw = String(filePath || '').trim();
    if (!raw) throw new Error('useExcel requires a CSV or JSON file path');
    if (raw.includes('\0')) throw new Error('invalid file path');

    const home = os.homedir();
    const userProfile = process.env.USERPROFILE || home;
    const folderNames = ['Desktop', 'Documents', 'Downloads'];
    // Only the named subfolders are allowed roots. The bare base directory is
    // intentionally excluded (see doc comment above).
    const expandFolderRoots = (base) => {
      const roots = [];
      for (const name of folderNames) {
        roots.push(path.join(base, name));
        // OneDrive Known Folder Move: Desktop may live under OneDrive\Desktop
        roots.push(path.join(base, 'OneDrive', name));
        roots.push(path.join(base, 'OneDrive - Personal', name));
      }
      return roots;
    };

    const candidates = [];
    if (path.isAbsolute(raw)) {
      candidates.push(path.resolve(raw));
    } else {
      candidates.push(path.resolve(OUTPUT_DIRECTORY, raw));
      candidates.push(path.resolve(home, raw));
      for (const name of folderNames) {
        candidates.push(path.resolve(home, name, raw));
      }
      if (process.platform === 'win32') {
        candidates.push(path.resolve(userProfile, raw));
        for (const name of folderNames) {
          candidates.push(path.resolve(userProfile, name, raw));
          candidates.push(path.resolve(userProfile, 'OneDrive', name, raw));
          candidates.push(path.resolve(userProfile, 'OneDrive - Personal', name, raw));
        }
      }
    }

    const allowedRoots = [
      OUTPUT_DIRECTORY,
      ...expandFolderRoots(home),
    ];
    if (process.platform === 'win32') {
      for (const root of expandFolderRoots(userProfile)) {
        if (!allowedRoots.includes(root)) allowedRoots.push(root);
      }
    }
    // realpath so junctions/symlinks (OneDrive Desktop) still pass the sandbox
    const resolvedAllowed = [];
    for (const root of allowedRoots) {
      resolvedAllowed.push(root);
      try {
        const real = fssync.realpathSync.native ? fssync.realpathSync.native(root) : fssync.realpathSync(root);
        if (real && !resolvedAllowed.includes(real)) resolvedAllowed.push(real);
      } catch (_) {}
    }

    let lastError = null;
    for (const candidate of candidates) {
      let realCandidate = candidate;
      try {
        realCandidate = fssync.realpathSync.native ? fssync.realpathSync.native(candidate) : fssync.realpathSync(candidate);
      } catch (_) {
        // file may not exist yet — still check lexical containment
      }
      const okRoot = resolvedAllowed.some((root) => isPathInsideRoot(candidate, root) || isPathInsideRoot(realCandidate, root));
      if (!okRoot) {
        lastError = new Error('useExcel path is outside allowed folders (Desktop/Documents/Downloads/rpa-output)');
        continue;
      }
      try {
        await fs.access(candidate);
        return candidate;
      } catch (_error) {
        try {
          await fs.access(realCandidate);
          return realCandidate;
        } catch (_) {
          lastError = new Error('useExcel file not found: ' + candidate);
        }
      }
    }
    throw lastError || new Error('useExcel requires a CSV or JSON file path');
  }

  evaluateCondition(params, variables) {
    const rawCond = params.condition;
    const condList = Array.isArray(rawCond) ? rawCond : [rawCond];
    const resolvedValues = condList.map((item) => resolveConditionValue(item, variables));
    const actual = (Array.isArray(rawCond) && rawCond.length > 1) ? resolvedValues : resolvedValues[0];
    const expected = getVariableValue(params.result, variables);
    const relation = String(params.relation || 'exist').toLowerCase();

    function isPresent(val) {
      if (val === undefined || val === null || val === '' || val === false) return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    }

    if (relation === 'exist') {
      if (expected != null && String(expected).trim() !== '') {
        const expectedStr = String(expected).trim();
        const candidates = expectedStr.split(',').map((s) => s.trim());
        if (Array.isArray(actual)) {
          return actual.every((v) => candidates.includes(String(v ?? '').trim()) || isPresent(v));
        }
        return candidates.includes(String(actual ?? '').trim());
      }
      return Array.isArray(actual) ? actual.every(isPresent) : isPresent(actual);
    }

    if (relation === 'notexist') {
      if (expected != null && String(expected).trim() !== '') {
        const expectedStr = String(expected).trim();
        const candidates = expectedStr.split(',').map((s) => s.trim());
        if (Array.isArray(actual)) {
          return !actual.every((v) => candidates.includes(String(v ?? '').trim()));
        }
        return !candidates.includes(String(actual ?? '').trim());
      }
      return Array.isArray(actual) ? actual.every((v) => !isPresent(v)) : !isPresent(actual);
    }

    if (relation === 'contain') {
      return String(actual ?? '').includes(String(expected ?? ''));
    }

    if (relation === 'notcontain') {
      return !String(actual ?? '').includes(String(expected ?? ''));
    }

    if (relation === 'equal') {
      const expStr = String(expected ?? '');
      if (expStr.includes(',')) {
        const parts = expStr.split(',').map((s) => s.trim());
        return parts.includes(String(actual ?? '').trim());
      }
      return String(actual ?? '') === expStr;
    }

    if (relation === 'notequal') {
      const expStr = String(expected ?? '');
      if (expStr.includes(',')) {
        const parts = expStr.split(',').map((s) => s.trim());
        return !parts.includes(String(actual ?? '').trim());
      }
      return String(actual ?? '') !== expStr;
    }

    if (relation === 'oneof') {
      if (Array.isArray(expected)) {
        return expected.map(String).includes(String(actual ?? ''));
      }
      const expStr = String(expected ?? '');
      if (expStr.includes(',')) {
        const parts = expStr.split(',').map((s) => s.trim());
        if (parts.includes(String(actual ?? '').trim())) return true;
      }
      return expStr.includes(String(actual ?? ''));
    }

    if (relation === 'less') return Number(actual) < Number(expected);
    if (relation === 'lessequal') return Number(actual) <= Number(expected);
    if (relation === 'more') return Number(actual) > Number(expected);
    if (relation === 'moreequal') return Number(actual) >= Number(expected);

    return Boolean(actual);
  }

  async readElement(ws, selector, params, serial = 1) {
    const elementType = String(params.type || 'object');
    const key = String(params.key || '');
    const expression = this.elementExpression(selector, params.selectorRadio, `el => {
      if (${JSON.stringify(elementType)} === 'object') return { selector: ${JSON.stringify(selector)} };
      if (${JSON.stringify(elementType)} === 'attribute') return el.getAttribute(${JSON.stringify(key)}) || '';
      if (${JSON.stringify(elementType)} === 'innerText') return el.innerText || el.textContent || '';
      if (${JSON.stringify(elementType)} === 'innerHTML') return el.innerHTML || '';
      if (${JSON.stringify(elementType)} === 'value') return el.value || '';
      if (${JSON.stringify(elementType)} === 'childrenNode') { const child = el.querySelector(${JSON.stringify(key)}); return child ? { selector: ${JSON.stringify(selector)} + ' ' + ${JSON.stringify(key)} } : null; }
      return { selector: ${JSON.stringify(selector)} };
    }`, false, serial);
    const result = await cdp.call(ws, 'Runtime.evaluate', { expression, returnByValue: true });
    return result.result?.value ?? null;
  }

  async listElements(ws, selector, params) {
    const elementType = String(params.type || 'object');
    const key = String(params.key || '');
    const expression = this.elementExpression(selector, params.selectorRadio, `el => {
      if (${JSON.stringify(elementType)} === 'attribute') return el.getAttribute(${JSON.stringify(key)}) || '';
      if (${JSON.stringify(elementType)} === 'innerText') return el.innerText || el.textContent || '';
      return { selector: ${JSON.stringify(selector)} };
    }`, true);
    const result = await cdp.call(ws, 'Runtime.evaluate', { expression, returnByValue: true });
    return Array.isArray(result.result?.value) ? result.result.value : [];
  }

  elementExpression(selector, selectorRadio, mapper, multiple = false, serial = 1) {
    const isXpath = String(selectorRadio || 'CSS').toUpperCase().startsWith('X');
    const finder = isXpath
      ? `(() => {
          const snap = document.evaluate(${JSON.stringify(selector)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          const arr = [];
          for (let i = 0; i < snap.snapshotLength; i++) arr.push(snap.snapshotItem(i));
          return arr;
        })()`
      : `Array.from(document.querySelectorAll(${JSON.stringify(selector)}))`;
    const index = Math.max(0, (Number(serial) || 1) - 1);
    return `(() => {
      const nodes = ${finder};
      const map = ${mapper};
      if (${multiple}) {
        return nodes.map(map).filter((item) => item != null);
      }
      const target = nodes[${index}];
      return target ? map(target) : null;
    })()`;
  }

  outputPath(name, extension) {
    const raw = String(name || 'output').replace(/[\\/:*?"<>|]+/g, '_').replace(/^\.+$/, 'output');
    const suffix = path.extname(raw) ? '' : extension;
    return path.join(OUTPUT_DIRECTORY, raw + suffix);
  }

  csvCell(value) {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    return `"${String(text).replace(/"/g, '""')}"`;
  }

  exportRecords(params, variables) {
    const candidate = getVariableValue(params.data || params.content || params.variable || '', variables);
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') return [candidate];
    const list = Object.values(variables).find(Array.isArray);
    return Array.isArray(list) ? list : [];
  }

  async findNetworkResource(port, matcher, timeout, { shouldAbort, ctx = null } = {}) {
    const deadline = Date.now() + timeout;
    // Filter inside the page: previously every poll serialized the FULL
    // performance entry list back through CDP (thousands of entries on heavy
    // pages, ~120 round-trips inside the 30s step window) and matched here.
    // Now the matcher crosses the boundary instead; the wire payload is the
    // hits themselves.
    const expression = `(() => { const matcher = ${JSON.stringify(String(matcher || ''))}; const all = performance.getEntriesByType("resource"); for (let i = all.length - 1; i >= 0; i--) { const entry = all[i]; if (!matcher || String(entry.name).includes(matcher)) return { name: entry.name, initiatorType: entry.initiatorType }; } return null; })()`;
    do {
      if (shouldAbort && shouldAbort()) throw new Error('cancelled');
      const resource = await this.withPage(port, async (ws) => {
        const result = await cdp.call(ws, 'Runtime.evaluate', {
          expression,
          returnByValue: true,
        });
        return result.result?.value || null;
      }, ctx);
      if (resource) return resource;
      if (!timeout) break;
      await sleep(250);
    } while (Date.now() < deadline);
    throw new Error('network resource not found: ' + matcher);
  }

  async withPage(port, fn, ctx = null) {
    // One /json/list per resolution: the pinned-tab lookup and the firstTab
    // fallback each used to issue their own HTTP roundtrip (two per step; in
    // 100-iteration loops this dominated step latency). The listing is cached
    // for this single withPage call only — never across steps — and a pinned-
    // tab miss falls back to the same first-tab preference cdp.firstTab uses.
    const list = await cdp.tabs(port);
    let tab = null;
    if (ctx?.activeTabId) {
      tab = list.find((item) => item.id === ctx.activeTabId) || null;
      // The pinned tab can vanish (user closed it, closetab step): fall back
      // to firstTab rather than failing the whole flow.
      if (!tab) ctx.activeTabId = null;
    }
    if (!tab) {
      tab = list.find((item) => !item.url.startsWith('chrome://') && !item.url.startsWith('edge://')) || list[0] || null;
    }
    if (!tab?.webSocketDebuggerUrl) throw new Error('No page tab for CDP port ' + port);
    return fn(tab.webSocketDebuggerUrl);
  }

  async focusSelector(ws, selector, selectorRadio = 'CSS', serial = 1) {
    const isXpath = String(selectorRadio || 'CSS').toUpperCase().startsWith('X');
    const index = Math.max(0, (Number(serial) || 1) - 1);
    // The existence check shares the query logic with the focusing version
    // but touches neither focus nor scroll, so waiting steps stay side-effect
    // free (focus steal + scrollIntoView every poll tick used to fight the
    // page's own scrolling and trigger focus-driven UI).
    const probeExpression = isXpath
      ? `(() => {
          const snap = document.evaluate(${JSON.stringify(selector)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          return Boolean(snap && snap.snapshotLength > ${index});
        })()`
      : `(() => {
          const nodes = document.querySelectorAll(${JSON.stringify(selector)});
          return Boolean(nodes && nodes.length > ${index});
        })()`;
    const probe = await cdp.call(ws, 'Runtime.evaluate', { expression: probeExpression, returnByValue: true });
    if (probe.result?.value !== true) throw new Error('Selector not found: ' + selector + (serial > 1 ? ` (index ${serial})` : ''));
    const focusExpression = isXpath
      ? `(() => {
          const snap = document.evaluate(${JSON.stringify(selector)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (!snap || snap.snapshotLength <= ${index}) return false;
          const el = snap.snapshotItem(${index});
          if (!el) return false;
          el.focus?.();
          el.scrollIntoView?.({ block: 'center', inline: 'center' });
          return true;
        })()`
      : `(() => {
          const nodes = document.querySelectorAll(${JSON.stringify(selector)});
          if (!nodes || nodes.length <= ${index}) return false;
          const el = nodes[${index}];
          if (!el) return false;
          el.focus?.();
          el.scrollIntoView?.({ block: 'center', inline: 'center' });
          return true;
        })()`;
    const result = await cdp.call(ws, 'Runtime.evaluate', { expression: focusExpression, returnByValue: true });
    if (result.result?.value !== true) throw new Error('Selector not found: ' + selector + (serial > 1 ? ` (index ${serial})` : ''));
  }

  async probeSelector(ws, selector, selectorRadio = 'CSS', serial = 1) {
    const isXpath = String(selectorRadio || 'CSS').toUpperCase().startsWith('X');
    const index = Math.max(0, (Number(serial) || 1) - 1);
    const expression = isXpath
      ? `(() => {
          const snap = document.evaluate(${JSON.stringify(selector)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          return Boolean(snap && snap.snapshotLength > ${index});
        })()`
      : `(() => {
          const nodes = document.querySelectorAll(${JSON.stringify(selector)});
          return Boolean(nodes && nodes.length > ${index});
        })()`;
    const result = await cdp.call(ws, 'Runtime.evaluate', { expression, returnByValue: true });
    if (result.result?.value !== true) throw new Error('Selector not found: ' + selector + (serial > 1 ? ` (index ${serial})` : ''));
  }

  async boundingBox(ws, selector, selectorRadio = 'CSS', serial = 1) {
    const isXpath = String(selectorRadio || 'CSS').toUpperCase().startsWith('X');
    const index = Math.max(0, (Number(serial) || 1) - 1);
    const expression = isXpath
      ? `(() => {
          const snap = document.evaluate(${JSON.stringify(selector)}, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (!snap || snap.snapshotLength <= ${index}) return null;
          const el = snap.snapshotItem(${index});
          if (!el || !el.getBoundingClientRect) return null;
          el.scrollIntoView?.({ block: 'center', inline: 'center' });
          const b = el.getBoundingClientRect();
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        })()`
      : `(() => {
          const nodes = document.querySelectorAll(${JSON.stringify(selector)});
          if (!nodes || nodes.length <= ${index}) return null;
          const el = nodes[${index}];
          if (!el || !el.getBoundingClientRect) return null;
          el.scrollIntoView?.({ block: 'center', inline: 'center' });
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        })()`;
    const result = await cdp.call(ws, 'Runtime.evaluate', { expression, returnByValue: true });
    return result.result?.value || null;
  }
}



// Step executor lookup table: canonical step type (every key of
// STEP_TYPE_ALIASES plus the canonical names themselves) → handler method
// name on RpaEngine. It replaces the old if/else dispatch chain; the
// load-time wiring check below keeps the table, the alias map and
// EXECUTABLE_STEP_TYPES from drifting apart.
const STEP_HANDLERS = {
  wait: 'stepWait', goto: 'stepGoto', reload: 'stepReload', newtab: 'stepNewTab',
  closetab: 'stepCloseTab', typetext: 'stepTypeText', click: 'stepClick', passingelement: 'stepPassingElement',
  selectelement: 'stepSelectElement', waitforselector: 'stepWaitForSelector', fortimes: 'stepForTimes', combineprocess: 'stepCombineProcess',
  forlists: 'stepForLists', ifelse: 'stepIfElse', whiledata: 'stepWhileData', focuselement: 'stepFocusElement',
  getelement: 'stepGetElement', forelements: 'stepForElements', tojson: 'stepToJson', savedata: 'stepSaveData',
  exportexcel: 'stepExportExcel', saveremark: 'stepSaveRemark', variableoperation: 'stepVariableOperation', useexcel: 'stepUseExcel',
  importtext: 'stepImportText', randomget: 'stepRandomGet', get2facode: 'stepGet2FACode', googlesheet: 'stepGoogleSheet',
  getcookies: 'stepGetCookies', getclipboard: 'stepGetClipboard', keycombination: 'stepBestEffortNoop', goback: 'stepGoBack',
  switchpage: 'stepSwitchPage', uploadattachment: 'stepUploadAttachment', downloadfile: 'stepDownloadFile', getrequest: 'stepNetworkRequest',
  getopenai: 'stepGetOpenAI', scroll: 'stepScroll', evaluate: 'stepEvaluate', screenshotpage: 'stepScreenshot',
  geturl: 'stepGetUrl', clearcookies: 'stepClearCookies', closebrowser: 'stepCloseBrowser', opennewbrowser: 'stepOpenNewBrowser',
  breakloop: 'stepBreakLoop', startnode: 'stepNoop', key: 'stepKey',
};

// Every executable type (canonical or alias) must resolve to a real handler
// method, and no alias may fall outside the executable set: a missing entry
// would silently turn into the "Unsupported RPA step type" throw at runtime,
// so fail fast at require time instead.
for (const stepType of EXECUTABLE_STEP_TYPES) {
  const canonical = Object.prototype.hasOwnProperty.call(STEP_TYPE_ALIASES, stepType)
    ? STEP_TYPE_ALIASES[stepType]
    : stepType;
  const handlerName = Object.prototype.hasOwnProperty.call(STEP_HANDLERS, canonical)
    ? STEP_HANDLERS[canonical]
    : null;
  if (!handlerName || typeof RpaEngine.prototype[handlerName] !== 'function') {
    throw new Error(`RPA step type without executor: ${stepType} (${canonical})`);
  }
}
for (const alias of Object.keys(STEP_TYPE_ALIASES)) {
  if (!EXECUTABLE_STEP_TYPES.has(alias)) {
    throw new Error(`RPA step alias missing from EXECUTABLE_STEP_TYPES: ${alias}`);
  }
}

module.exports = {
  RpaEngine,
  RPA_PLUS_ACTIONS,
  parseProcessContent,
  findUnsupportedSteps,
  snapshotVariables,
  BreakLoopSignal,
  resolveElementTarget,
  resolveSerial,
  resolveOpenConcurrency,
  DEFAULT_OPEN_CONCURRENCY,
};
