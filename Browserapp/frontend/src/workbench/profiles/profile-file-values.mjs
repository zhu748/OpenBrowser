const accountLine = /^(?!:)(?<platform>https?:\/\/[^:\s[\]{}]+)?(?::?(?<username>[^:[\]{}\s]+)(?::(?<password>[^:[\]{}\s]+))?(?::(?<twoFactor>[^:[\]{}\s]+))?)?(?:\[(?<linkedEmail>[^[\]]+)\])?(?:\{(?<remark>[^{}]+)\})?$/;

export function parseAccountLine(value) {
  return typeof value === 'string' ? accountLine.exec(value)?.groups ?? {} : {};
}

export function cellText(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object' && 'text' in value) return String(value.text).trim();
  if (Array.isArray(value?.richText)) return value.richText.map(part => part.text).join('').trim();
  return String(value).trim();
}

function arrayFromJson(value, label) {
  const rows = JSON.parse(value || '[]');
  if (!Array.isArray(rows)) throw Error(`${label} 必须是 JSON 数组`);
  return rows;
}

export function parseAccounts(value) {
  return arrayFromJson(value, '平台账号').map(line => {
    const item = parseAccountLine(line);
    if (!item.platform && !item.username && !item.linkedEmail && !item.remark) throw Error('平台账号格式错误');
    return { platformUrl: item.platform, platformUserName: item.username || '', platformPassword: item.password || '', platformEfa: item.twoFactor || '' };
  });
}

export const parseStartupUrls = value => arrayFromJson(value, '打开网址');
