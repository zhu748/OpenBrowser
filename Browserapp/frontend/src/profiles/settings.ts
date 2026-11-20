export const systems = ['Windows', 'macOS', 'Linux', 'Android', 'IOS'];
export const preferenceFields = [
  { key: 'useGpu', label: '硬件加速' },
  { key: 'clearCacheFile', label: '启动时清理缓存' },
  { key: 'syncCookie', label: '关闭窗口时保存 Cookie' },
] as const;

export function readSettings(value: Record<string, unknown> = {}) {
  return {
    os: String(value.os || 'Windows'),
    coreType: String(value.coreType || 'Chrome'),
    coreVersion: value.useLatestCore ? 'latest' : String(value.coreVersion || 'latest'),
    projectId: String(value.projectId || 'local-default'),
    urls: Array.isArray(value.defaultOpenUrl) ? value.defaultOpenUrl.join('\n') : '',
    openWidth: Number(value.openWidth) || 1280,
    openHeight: Number(value.openHeight) || 820,
    useGpu: value.useGpu !== false,
    clearCacheFile: value.clearCacheFile === true,
    syncCookie: value.syncCookie === true,
  };
}

type Settings = ReturnType<typeof readSettings>;

function startupUrls(value: string) {
  const urls = value.split(/\r?\n/).map(row => row.trim()).filter(Boolean);
  if (urls.length > 50 || urls.join('\n').length > 8000) throw new Error('启动网址最多 50 条且总长度不能超过 8000 字符');
  for (const url of urls) {
    if (url.length > 2000) throw new Error('单条启动网址不能超过 2000 字符');
    if (url === 'about:blank') continue;
    const parsed = URL.canParse(url) ? new URL(url) : null;
    if (!parsed || !['http:', 'https:'].includes(parsed.protocol)) throw new Error('请输入 HTTP、HTTPS 或 about:blank 启动网址');
  }
  return urls;
}

export function changedSettings(initial: Settings, draft: Settings): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const field of ['os', 'coreType', 'projectId', ...preferenceFields.map(row => row.key)] as const) {
    if (initial[field] !== draft[field]) patch[field] = draft[field];
  }
  if (initial.coreVersion !== draft.coreVersion || initial.coreType !== draft.coreType) {
    patch.useLatestCore = draft.coreVersion === 'latest';
    patch.coreVersion = draft.coreVersion;
  }
  if (initial.urls !== draft.urls) patch.defaultOpenUrl = startupUrls(draft.urls);
  for (const [field, min, max] of [['openWidth', 640, 7680], ['openHeight', 480, 4320]] as const) {
    const size = draft[field];
    if (size === initial[field]) continue;
    if (!Number.isInteger(size) || size < min || size > max) throw new Error(`窗口${field === 'openWidth' ? '宽度' : '高度'}范围为 ${min}–${max}`);
    patch[field] = size;
  }
  return patch;
}
