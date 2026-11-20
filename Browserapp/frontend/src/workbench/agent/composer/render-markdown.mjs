import { marked, Renderer } from './workbench-marked.js';
import { faviconForLink, normalizeLinkPaths, prepareLinks } from './workbench-markdown-links.js';
import { ensureTokenTooltipElements, windowNames } from './workbench-profile-token-labels.js';

const renderer = new Renderer();
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const inputKinds = new Set(['input', 'textarea', 'url', 'project']);
const marker = /\[(@profile|@script|input|textarea|url|project):|\[\$/;
const markup = /\[(@profile|@script):([^\]]+)\]\(([^)]*)\)|\[(input|textarea|url|project):([^\]]+)\](?:\(([^)]*)\))?|\[\$([^\]]+)\]\(([^)]+)\)/;

function readToken(source) {
  const match = markup.exec(source);
  if (!match || match.index !== 0) return;
  const [, reference, referenceTitle, referenceTarget, field, fieldTitle, fieldValue, skill, skillPath] = match;
  if (reference) return { type: 'agentToken', raw: match[0], kind: reference === '@profile' ? 'profile' : 'script', title: referenceTitle, target: referenceTarget };
  if (inputKinds.has(field)) return { type: 'agentToken', raw: match[0], kind: field, title: fieldTitle, target: fieldValue || '' };
  return { type: 'agentToken', raw: match[0], kind: 'skill', title: skill, target: skillPath };
}

function tokenHtml({ kind, title, target }) {
  let label = inputKinds.has(kind) ? target.trim() || title : title;
  let attributes = '';
  if (kind === 'profile') {
    const numericTitle = Number(title);
    const count = Number.isFinite(numericTitle) && numericTitle > 0 ? numericTitle : target.split(',').filter(Boolean).length;
    const ids = target.split(',').map(id => id.trim()).filter(Boolean);
    label = count ? $t('窗口') : $t('选择窗口');
    const details = count ? ensureTokenTooltipElements(windowNames(ids), count) : '';
    if (count) attributes += ` count="${count}"`;
    if (details) attributes += ` details="${escapeHtml(details)}"`;
  }
  return `<roxy-agent-token kind="${escapeHtml(kind)}" title="${escapeHtml(label)}" target="${escapeHtml(target)}"${attributes}></roxy-agent-token>`;
}

function decorateLink(html, raw, url) {
  const favicon = faviconForLink(url);
  const icon = favicon ? ` data-agent-favicon-url="${escapeHtml(favicon)}"` : '';
  return html.replace('<a ', `<a data-markdown-source="${encodeURIComponent(raw)}"${icon} `);
}

function punctuationOffset(link) {
  if (link.raw !== link.text || !/^(?:(?:https?|ftp):\/\/|www\.)/i.test(link.text)) return -1;
  return link.text.search(/[、。，！？；：）］｝〉》」』】〕〗〙〛”’]/u);
}

marked.use({
  renderer: {
    html({ text }) { return escapeHtml(text); },
    link(token) {
      if (!token.href.trim()) return escapeHtml(token.raw);
      renderer.parser = this.parser;
      const ending = punctuationOffset(token);
      if (ending < 0) return decorateLink(renderer.link(token), token.raw, token.href);
      const text = token.text.slice(0, ending);
      const suffix = token.text.slice(ending);
      const href = token.href.slice(0, token.href.length - suffix.length);
      const link = { ...token, raw: text, text, href, tokens: [{ type: 'text', raw: text, text }] };
      return decorateLink(renderer.link(link), text, href) + marked.parseInline(suffix, { async: false });
    },
    code(token) {
      return `<div class="agent-md-code">${renderer.code(token)}<roxy-agent-code-copy encoded-code="${encodeURIComponent(token.text)}"></roxy-agent-code-copy></div>`;
    },
    table(token) {
      renderer.parser = this.parser;
      return `<div class="agent-md-table"><div class="agent-md-table__scroll">${renderer.table(token)}</div><roxy-agent-table-copy encoded-markdown="${encodeURIComponent(token.raw.trimEnd())}"></roxy-agent-table-copy></div>`;
    },
  },
  extensions: [{ name: 'agentToken', level: 'inline', start: source => {
    const offset = source.search(marker);
    if (offset >= 0) return offset;
  }, tokenizer: readToken, renderer: token => token.type === 'agentToken' ? tokenHtml(token) : '' }],
});

export function renderMarkdown(markdown, { preserveLineBreaks = false } = {}) {
  return prepareLinks(marked.parse(normalizeLinkPaths(markdown), { async: false, breaks: preserveLineBreaks }));
}
