import { h } from './workbench-vue.js';
import { i as defineCustomElement } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import { or as writeClipboard } from './utils-BIWenCnY.js';
import { codeCopyCss, tableCopyCss, tokenCss } from './workbench-markdown-element-styles.js';

export const copyIcon = 'base/rx_ic_copy';
export const successIcon = 'base/rx_ic_check';
export const resetDelay = 1200;
export async function copyText(text) {
  if (!text) return false;
  await writeClipboard(text);
  return true;
}

function decodeText(text) {
  try { return decodeURIComponent(text); }
  catch { return text; }
}

function copyElement(attribute, css) {
  return defineCustomElement({
    props: { [attribute]: { type: String, default: '' } },
    styles: [css],
    data: () => ({ copied: false, copiedTimer: null }),
    unmounted() { clearTimeout(this.copiedTimer); },
    methods: {
      async copy(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!await copyText(decodeText(this[attribute]))) return;
        this.copied = true;
        clearTimeout(this.copiedTimer);
        this.copiedTimer = window.setTimeout(() => { this.copied = false; this.copiedTimer = null; }, resetDelay);
      },
    },
    render() {
      const label = this.copied ? $t('已复制') : $t('复制');
      return h('span', { role: 'button', tabindex: 0, class: ['copy-control', { copied: this.copied }], title: label,
        'aria-label': label, onClick: this.copy, onKeydown: event => {
          if (event.key === 'Enter' || event.key === ' ') this.copy(event);
        } }, [h('roxy-svg-icon', { name: this.copied ? successIcon : copyIcon, size: 14, color: 'currentColor' })]);
    },
  });
}

const inputKinds = new Set(['input', 'textarea', 'url', 'project']);
const tokenIcons = { profile: 'rx-ic-token-profile', skill: 'rx-ic-skills', script: 'rx-ic-scripts',
  input: 'rx-ic-prompts', textarea: 'rx-ic-prompts', url: 'rx-ic-url', project: 'rx-ic-prompts' };

const Token = defineCustomElement({
  props: { kind: { type: String, default: 'skill' }, title: { type: String, default: '' }, target: { type: String, default: '' },
    count: { type: String, default: '' }, details: { type: String, default: '' } },
  styles: [tokenCss],
  render() {
    const kind = Object.hasOwn(tokenIcons, this.kind) ? this.kind : 'skill';
    const icon = `roxy-agent/${tokenIcons[kind]}`;
    const count = kind === 'profile' ? this.count.trim() : '';
    const target = this.target.trim();
    const label = inputKinds.has(kind) && target || this.title;
    const children = [h('span', { class: 'agent-token__icon' }, [h('roxy-svg-icon', { name: icon, fallback: icon, size: 16 })]),
      h('span', { class: 'agent-token__label' }, label)];
    const classes = ['agent-token', `agent-token--${kind}`, {
      'agent-token--profile-empty': kind === 'profile' && !target, 'agent-token--input-empty': inputKinds.has(kind) && !target,
    }];
    return h('span', { class: classes, 'data-agent-token': kind, 'data-kind': kind, 'data-title': this.title,
      'data-target': this.target, 'data-count': count, 'data-details': this.details }, count ? [
      h('span', { class: 'agent-token__profile-prefix' }, children),
      h('span', { class: 'agent-token__profile-detail' }, [h('span', { class: 'agent-token__profile-names' }, this.details)]),
    ] : children);
  },
});

const CodeCopy = copyElement('encodedCode', codeCopyCss);
const TableCopy = copyElement('encodedMarkdown', tableCopyCss);
function register(name, element) {
  if (typeof customElements !== 'undefined' && !customElements.get(name)) customElements.define(name, element);
}

export const registerToken = () => register('roxy-agent-token', Token);
export const registerCodeCopy = () => register('roxy-agent-code-copy', CodeCopy);
export const registerTableCopy = () => register('roxy-agent-table-copy', TableCopy);
