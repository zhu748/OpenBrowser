import { pinyin } from './workbench-pinyin.js';

const chinese = /[\u4e00-\u9fa5]/;
function workspaceCode(name, length = 3) {
  if (!name) return '';
  if (!chinese.test(name)) return name.slice(0, length).toLocaleUpperCase();
  let code = '';
  for (const char of name) {
    if (code.length >= length) break;
    code += chinese.test(char) ? pinyin(char, { toneType: 'none' }) : char;
  }
  return code.slice(0, length).toLocaleUpperCase();
}
function workspaceAvatar({ workspacePicture, workspacePictureUrl, workspaceName, size, emojiFontSize, textFontSize, radius = '6px' }) {
  const title = workspaceName?.slice(0, 2);
  const color = 'var(--pattern-topnav-space-avatar-bg)';
  if (workspacePictureUrl) return { avatar: workspacePictureUrl, name: title, color, size, fontSize: textFontSize, radius, compact: false };
  const compact = !workspacePicture && Boolean(title && [...title].some(char => char.codePointAt(0) > 127));
  const fontSize = workspacePicture ? emojiFontSize : compact ? Math.round(textFontSize * 26 / 34) : textFontSize;
  return { name: workspacePicture || title, color: workspacePicture ? 'var(--pattern-topnav-space-emoji-bg)' : color, size, fontSize, radius, compact };
}
export { workspaceCode as n, workspaceAvatar as t };
