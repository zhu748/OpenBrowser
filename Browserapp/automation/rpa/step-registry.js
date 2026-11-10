'use strict';

const { resolveStepChildren } = require('./step-shape');

// Each executor declares its accepted spellings once; validation and dispatch share it.
const STEPS = [
  ['stepWait', ['wait', 'sleep', 'delay', 'waittime']],
  ['stepGoto', ['goto', 'navigate', 'open', 'gotourl']],
  ['stepReload', ['reload', 'refreshpage']],
  ['stepNewTab', ['newtab', 'new_tab', 'newpage']],
  ['stepCloseTab', ['closetab', 'close_tab', 'closepage']],
  ['stepTypeText', ['typetext', 'type', 'input', 'inserttext', 'inputcontent']],
  ['stepClick', ['click', 'clickelement']],
  ['stepPassingElement', ['passingelement', 'hover']],
  ['stepSelectElement', ['selectelement']],
  ['stepWaitForSelector', ['waitforselector']],
  ['stepForTimes', ['fortimes']],
  ['stepCombineProcess', ['combineprocess']],
  ['stepForLists', ['forlists']],
  ['stepIfElse', ['ifelse']],
  ['stepWhileData', ['whiledata']],
  ['stepFocusElement', ['focuselement']],
  ['stepGetElement', ['getelement']],
  ['stepForElements', ['forelements']],
  ['stepToJson', ['tojson', 'extractkey', 'extractdata']],
  ['stepSaveData', ['savedata']],
  ['stepExportExcel', ['exportexcel']],
  ['stepSaveRemark', ['saveremark']],
  ['stepVariableOperation', ['variableoperation']],
  ['stepUseExcel', ['useexcel']],
  ['stepImportText', ['importtext']],
  ['stepRandomGet', ['randomget']],
  ['stepGet2FACode', ['get2facode']],
  ['stepGoogleSheet', ['googlesheet']],
  ['stepGetCookies', ['getcookies']],
  ['stepGetClipboard', ['getclipboard', 'getactiveelement']],
  ['stepGoBack', ['goback']],
  ['stepSwitchPage', ['switchpage']],
  ['stepUploadAttachment', ['uploadattachment']],
  ['stepDownloadFile', ['downloadfile']],
  ['stepNetworkRequest', ['getrequest', 'waitforresponse', 'getresponse', 'stoplinsten']],
  ['stepGetOpenAI', ['getopenai']],
  ['stepScroll', ['scroll', 'scrollpage']],
  ['stepEvaluate', ['evaluate', 'script', 'js', 'javascript']],
  ['stepScreenshot', ['screenshotpage', 'screenshot']],
  ['stepGetUrl', ['geturl']],
  ['stepClearCookies', ['clearcookies']],
  ['stepCloseBrowser', ['closebrowser']],
  ['stepOpenNewBrowser', ['opennewbrowser']],
  ['stepBreakLoop', ['breakloop', 'break']],
  ['stepNoop', ['startnode', 'noop']],
  ['stepKey', ['key', 'press', 'keyboard']],
];

// Known marketplace actions without an implementation remain visible to tooling,
// but cannot pass execution validation or silently turn a task into a success.
const unavailable = new Map([
  ['keycombination', 'Keyboard combinations are not implemented'],
  ['applysubprocess', 'External subprocess plans are not implemented'],
  ['getcaptcha', 'No captcha provider is configured'],
  ['closeotherpage', 'Closing other pages is not implemented'],
  ['getemail', 'No email provider is configured'],
  ['savetag', 'Saving marketplace tags is not implemented'],
]);

const handlers = new Map();
for (const [handler, types] of STEPS) {
  for (const type of types) {
    if (handlers.has(type)) throw new Error('Duplicate RPA step type: ' + type);
    handlers.set(type, handler);
  }
}
const executableStepTypes = Object.freeze([...handlers.keys()]);
const MAX_VALIDATION_DEPTH = 64;
const MAX_VALIDATION_STEPS = 10000;

function resolveStepHandler(type) { return handlers.get(String(type || '').toLowerCase()) || null; }

function getStepCapability(type) {
  const key = String(type || '').toLowerCase();
  const handler = resolveStepHandler(key);
  return Object.freeze({ type: key, status: handler ? 'supported' : 'unsupported', handler,
    message: handler ? '' : (unavailable.get(key) || 'Unknown RPA action') });
}

const unsupportedStepTypes = Object.freeze([...unavailable.keys()]);

function validateStepHandlers(prototype) {
  for (const [type, handler] of handlers) {
    if (typeof prototype[handler] !== 'function') throw new Error(`RPA step type without executor: ${type} (${handler})`);
  }
}

/** Validation and capability disclosure follow the same executable branches and budgets. */
function analyzeStepGraph(steps, path = []) {
  const sensitive = { evaluate: 0, openai: 0, download: 0 };
  if (!Array.isArray(steps)) return { unsupported: [{ path, type: '', reason: 'steps must be an array' }], sensitive };
  const unsupported = []; const ancestors = new Set();
  let visited = 0; let exhausted = false;
  const visit = (list, prefix, depth) => {
    if (depth > MAX_VALIDATION_DEPTH || ancestors.has(list)) {
      unsupported.push({ path: prefix, type: '(invalid graph)', reason: depth > MAX_VALIDATION_DEPTH ? 'step nesting exceeds limit' : 'cyclic steps' });
      return;
    }
    ancestors.add(list);
    try {
      for (let index = 0; index < list.length && !exhausted; index += 1) {
        const currentPath = [...prefix, index + 1];
        if (++visited > MAX_VALIDATION_STEPS) {
          unsupported.push({ path: currentPath, type: '(budget)', reason: 'step count exceeds limit' });
          exhausted = true;
          break;
        }
        const step = list[index] || {};
        const type = String(step.type || step.action || '').toLowerCase();
        const handler = resolveStepHandler(type);
        if (!handler) unsupported.push({ path: currentPath, type: type || '(empty)', message: getStepCapability(type).message });
        if (handler === 'stepEvaluate') sensitive.evaluate += 1;
        else if (handler === 'stepGetOpenAI') sensitive.openai += 1;
        else if (handler === 'stepDownloadFile') sensitive.download += 1;
        for (const key of ['children', 'elseChildren', 'errorChildren']) {
          if (exhausted) break;
          const children = resolveStepChildren(step, key);
          if (Array.isArray(children)) visit(children, currentPath, depth + 1);
        }
      }
    } finally { ancestors.delete(list); }
  };
  visit(steps, path, 0);
  return { unsupported, sensitive };
}

function findUnsupportedSteps(steps, path = []) {
  return analyzeStepGraph(steps, path).unsupported;
}

function assertStepGraph(steps) {
  const invalid = findUnsupportedSteps(steps).find((issue) => issue.reason);
  if (invalid) throw Object.assign(new Error('Invalid RPA step graph: ' + invalid.reason), { code: 'RPA_INVALID_GRAPH' });
}

module.exports = { resolveStepHandler, validateStepHandlers, executableStepTypes, unsupportedStepTypes, getStepCapability, analyzeStepGraph, findUnsupportedSteps, assertStepGraph };
