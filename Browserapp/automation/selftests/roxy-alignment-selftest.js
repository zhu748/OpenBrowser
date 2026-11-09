'use strict';

/** RoxyBrowser 4.1.0 对齐回归：编辑器结构/字段往返、列表页、引擎守护、词条覆盖。 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.message || String(error) });
  }
}

// 在受控沙箱里加载 ui/ui-editor.js（纯函数层：normalizeProfileSettings / 随机指纹）
function loadUiEditor() {
  const context = {
    window: {},
    UNGROUPED_ID: 'ungrouped',
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    Number, String, Boolean, Array, Object, JSON, Math, Date, Intl, Error, Set,
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read('ui/ui-editor.js'), context, { filename: 'ui-editor.js' });
  return context;
}

check('编辑器标记包含 Roxy 对齐的关键结构', () => {
  const html = read('index.html');
  for (const marker of [
    'id="editor-geo-permission"', 'id="editor-os-version"', 'id="editor-engine-version"',
    'id="editor-proxy-choose-block"', 'id="editor-direct-banner"', 'id="editor-direct-exit"',
    'id="editor-window-pos-grid"', 'id="editor-allow-urls"', 'id="editor-session-storage-data"',
    'id="editor-prompt-save-password"', 'id="editor-open-workbench"', 'id="editor-ip-change-remind"',
    'id="editor-google-login"', 'id="editor-stop-open-net"', 'id="editor-stop-open-ip"',
    'id="editor-stop-open-ip-country"', 'id="editor-id-copy"', 'id="editor-id-text"',
    'id="editor-random-fp-rail"', 'id="editor-rail-tutorial"', 'id="editor-platform-name"',
    'data-list-tab="all"', 'data-list-tab="fav"', 'data-list-tab="open"', 'data-list-tab="trash"',
    'profiles.col.note', 'profiles.col.lastOpen', 'profiles.col.more',
  ]) assert.ok(html.includes(marker), `index.html 缺少 ${marker}`);
  // 代理三段式
  assert.ok(/name="editor-network" value="direct"/.test(html) && /name="editor-network" value="custom"/.test(html) && /name="editor-network" value="choose"/.test(html));
  // data-i18n 不能落在含控件的 label 上（textContent 覆盖会吞控件）
  assert.ok(!/<label data-i18n="[^"]+"><(?:input|select|textarea|div)/.test(html), 'label 级 data-i18n 会吞掉内部控件');
});

check('sanitizeProfile 往返保留对齐字段并折算旧 geoMode', () => {
  const base = () => ({
    id: 'env-align1',
    name: 'align',
    privacy: { geoMode: 'disabled', memory: 16, accuracy: 100 },
    advanced: {
      stopOpenNet: true, stopOpenIPChange: true, stopOpenIPCountryChange: true,
      openWorkbench: '0', ipChangeRemind: '1', googleLogin: '2',
      allowUrls: 'example.com', syncSessionStorage: true, sessionStorages: '[{"domain":"a.com","key":["k"]}]',
    },
    platform: { type: 'facebook', name: '账号A', username: 'u', password: 'p', totpSecret: 't' },
    osVersion: '11', engineVersion: '131', favorite: true, lastOpenedAt: '2026-11-09T00:00:00Z',
  });
  const out = sanitizeProfile(base());
  assert.strictEqual(out.privacy.geoPermission, 'deny');
  assert.strictEqual(out.privacy.memory, 16);
  assert.strictEqual(out.advanced.stopOpenNet, true);
  assert.strictEqual(out.advanced.stopOpenIPCountryChange, true);
  assert.strictEqual(out.advanced.openWorkbench, '0');
  assert.strictEqual(out.advanced.ipChangeRemind, '1');
  assert.strictEqual(out.advanced.googleLogin, '2');
  assert.strictEqual(out.advanced.allowUrls, 'example.com');
  assert.strictEqual(out.advanced.syncSessionStorage, true);
  assert.ok(out.advanced.sessionStorages.includes('a.com'));
  assert.strictEqual(out.platform.name, '账号A');
  assert.strictEqual(out.osVersion, '11');
  assert.strictEqual(out.engineVersion, '131');
  assert.strictEqual(out.favorite, true);
  assert.strictEqual(out.lastOpenedAt, '2026-11-09T00:00:00Z');
  // prompt 折算 + accuracy 收敛到 10..5000
  const promptOut = sanitizeProfile({ ...base(), privacy: { geoMode: 'prompt' } });
  assert.strictEqual(promptOut.privacy.geoPermission, 'prompt');
  const wide = sanitizeProfile({ ...base(), privacy: { accuracy: 99999 } });
  assert.ok(wide.privacy.accuracy <= 5000 && wide.privacy.accuracy >= 10);
  // 未设置 geoPermission 的旧 profile（geoMode=ip）→ allow
  const legacy = sanitizeProfile({ id: 'env-align2', name: 'l', privacy: { geoMode: 'ip' }, advanced: {} });
  assert.strictEqual(legacy.privacy.geoPermission, 'allow');
});

check('ui-editor 模块导出对齐辅助且 schema 带默认值', () => {
  const context = loadUiEditor();
  for (const fn of ['openProfileEditor', 'fillEditorVersionSelects', 'syncEditorSegmented', 'syncEditorPosGrid', 'renderDirectBanner', 'wireEditorAlignmentControls', 'randomizeFingerprintDraft']) {
    assert.strictEqual(typeof context[fn], 'function', `缺少导出 ${fn}`);
  }
  const source = read('ui/ui-editor.js');
  assert.match(source, /geoPermission: \[/, 'normalizeProfileSettings 需折算 geoPermission');
  assert.match(source, /segClose\('editor-video-mode'\)/, '视频开关需读分段控件');
  assert.match(source, /editorSearchEngine|searchEngine: \$\('#editor-search-engine'\)/, '搜索引擎需从编辑器读取');
  // 概要 canonical 行
  assert.ok(source.includes("tx('操作系统')") && source.includes("tx('内核类型')") && source.includes("tx('硬件并发数')") && source.includes("tx('设备内存')"));
});

check('renderer 列表页与行菜单对齐实现完整', () => {
  const source = read('renderer.js');
  for (const fn of ['renderListTabs', 'switchListTab', 'toggleRowMoreMenu', 'closeRowMoreMenu', 'toggleProfileFavorite', 'exportProfile']) {
    assert.ok(source.includes(`function ${fn}(`), `renderer.js 缺少 ${fn}`);
  }
  assert.match(source, /profile\.lastOpenedAt = new Date\(\)\.toISOString\(\)/, '启动成功需记录最后打开时间');
  assert.match(source, /activeListTab === 'fav'/, '收藏标签过滤');
  assert.match(source, /activeListTab === 'open'/, '已打开标签过滤');
  assert.match(source, /webrtc: 'disabled'/, '新环境 WebRTC 默认禁止（Roxy 对齐）');
  assert.match(source, /portScanProtect: true/, '新环境端口扫描保护默认开');
  assert.match(source, /dntMode: 'on'/, '新环境 DNT 默认开启');
  assert.match(source, /cores: '12'/, '新环境硬件并发默认 12');
  assert.match(source, /memory: '8'/, '新环境设备内存默认 8G');
  assert.match(source, /macMode: 'custom'/, '新环境 MAC 默认自定义');
  assert.ok(source.includes('Ctrl+F') || source.includes("event.key.toLowerCase() === 'f'"), '需要全局 Ctrl+F 聚焦搜索');
  const wiring = read('ui/ui-proxy-wiring.js');
  for (const act of ["'more'", "'fav'", "'copy-id'", "'export-profile'", "'note'"]) {
    assert.ok(wiring.includes(`action?.dataset.action === ${act}`), `wiring 缺少行动作 ${act}`);
  }
});

check('引擎启动守护（网络不通/IP 变化/IP 国家变化）已接线', () => {
  const start = read('engine/start.js');
  assert.match(start, /stopOpenNet/, 'stopOpenNet 守护');
  assert.match(start, /network-unavailable/, '网络不可用阻断码');
  assert.match(start, /stopOpenIPChange/, 'IP 变化停止打开');
  assert.match(start, /stopOpenIPCountryChange/, 'IP 国家变化停止打开');
  const startPage = read('engine/start-page.js');
  assert.match(startPage, /options\.force/, '出口检测需支持 force');
  assert.match(startPage, /if \(options\.force\) throw error/, 'force 模式需上抛检测失败');
});

check('i18n 中英词条覆盖全部新增键', () => {
  const table = read('i18n.js');
  const keys = [
    'editor.pageTitle', 'editor.copyId', 'editor.profileName', 'editor.startWebPage', 'editor.startUrlPh',
    'editor.localNetPrefix', 'editor.localNetWarn1', 'editor.localNetWarn2',
    'editor.proxyNoUse', 'editor.proxyAdd', 'editor.proxyChoose', 'editor.os', 'editor.kernel',
    'editor.uiLanguage', 'editor.geoPermission', 'editor.geoAsk', 'editor.geoAllow', 'editor.geoDeny',
    'editor.size', 'editor.position', 'editor.searchEngine', 'editor.sound', 'editor.image', 'editor.video',
    'editor.hwConcurrency', 'editor.deviceMemory', 'editor.stopOpenNet', 'editor.stopOpenIP',
    'editor.stopOpenIPCountry', 'editor.openWorkbench', 'editor.googleLogin', 'editor.followSoftware',
    'editor.urlRules', 'editor.blockDomainList', 'editor.allowDomainList', 'editor.sessionStorageSync',
    'editor.tutorial', 'editor.randomFingerprint', 'editor.cookies',
    'profiles.tabAll', 'profiles.tabFav', 'profiles.tabOpen', 'profiles.tabTrash',
    'profiles.col.note', 'profiles.col.tag', 'profiles.col.project', 'profiles.col.lastOpen', 'profiles.col.more',
    'profiles.openProfile', 'profiles.copyId', 'profiles.exportProfile', 'profiles.menuDelete',
    'editor.summary.custom',
  ];
  for (const key of keys) {
    const count = table.split(`'${key}':`).length - 1;
    assert.ok(count >= 2, `词条 ${key} 需同时存在于 zh 与 en 表（当前 ${count}）`);
  }
});

check('列表纯函数模块保持可用', () => {
  const list = require('../../ui/ui-profile-list');
  const rows = [
    { id: 'a', name: 'A', trashed: false, groupId: 'g1', tag: '主力' },
    { id: 'b', name: 'B', trashed: true, groupId: '', tag: '' },
  ];
  assert.strictEqual(list.filterProfiles({ profiles: rows, activeGroupFilter: 'all', query: '' }).length, 1);
  assert.strictEqual(list.filterProfiles({ profiles: rows, activeGroupFilter: 'trash', query: '' }).length, 1);
  assert.strictEqual(list.filterProfiles({ profiles: rows, activeGroupFilter: 'all', query: '主力' }).length, 1);
  const page = list.paginate([1, 2, 3], 2, 2);
  assert.deepStrictEqual(page, { items: [3], currentPage: 2, totalPages: 2, total: 3 });
});

for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n      -> ' + r.error}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\nroxy-alignment-selftest: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
