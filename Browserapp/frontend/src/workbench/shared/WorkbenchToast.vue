<script setup>
import { onBeforeUnmount } from './workbench-vue.js';
import { t as Toast } from './toast-CjMybmc4.js';
import { t as Badge } from './overlaybadge-B-go4u-h.js';
import { n as SuccessIcon } from './rx_ic_check_fill-DhZ0qHY_.js';
import { n as CloseIcon } from './rx_ic_delete-CnrObAWC.js';
import { n as InfoIcon } from './rx_ic_info_fill-BKETVyN3.js';
import { n as WarningIcon } from './rx_ic_warn_fill-D1nvFIgs.js';

const icons = { success: SuccessIcon, warn: InfoIcon, error: InfoIcon, info: WarningIcon };
const root = { root: 'rx-toast-headless translate-x-[-50%] z-10' };
const messages = new Map();
const keyOf = message => `${String(message.id)}_${message.severity ?? ''}`;
function contentSignature(content, depth = 0) {
  if (depth > 6 || content == null) return '';
  if (typeof content === 'string' || typeof content === 'number') return String(content);
  if (Array.isArray(content)) return content.map(item => contentSignature(item, depth + 1)).filter(Boolean).join('\n');
  if (typeof content !== 'object') return '';
  const { type, props, children } = content;
  const values = [typeof type === 'string' ? type : type?.name || type?.__name];
  for (const name of ['label', 'title', 'content', 'message']) {
    if (typeof props?.[name] === 'string' || typeof props?.[name] === 'number') values.push(String(props[name]));
  }
  values.push(contentSignature(children, depth + 1));
  return values.filter(Boolean).join('|');
}
function clear(message) {
  const key = keyOf(message);
  clearTimeout(messages.get(key)?.timer);
  messages.delete(key);
}
function close(message, closeCallback) {
  clear(message);
  closeCallback();
}
function runAction(message, closeCallback) {
  if (typeof message.onClick !== 'function') return;
  close(message, closeCallback);
  message.onClick();
}
function keyAction(event, message, closeCallback) {
  if (!['Enter', ' '].includes(event.key) || typeof message.onClick !== 'function') return;
  event.preventDefault();
  runAction(message, closeCallback);
}
function pause(message) {
  clearTimeout(messages.get(keyOf(message))?.timer);
}
function resume(message, closeCallback) {
  const entry = messages.get(keyOf(message));
  if (!entry) return;
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => close(message, closeCallback), Math.max(1000, message.originLife - (Date.now() - message.startTimestamp)));
}
function register(message, closeCallback) {
  const key = keyOf(message);
  if (messages.has(key)) return;
  if (!Object.hasOwn(message, 'life') || message.life === 0) message.life = 2500;
  const existing = [...messages.values()].find(({ message: previous }) => previous.id !== message.id && previous.severity === message.severity
    && ((previous.groupId != null && previous.groupId === message.groupId)
    || (contentSignature(previous.summary) === contentSignature(message.summary) && contentSignature(previous.detail) === contentSignature(message.detail))));
  if (existing) {
    existing.message.hide = true;
    message.count = (existing.message.count || 1) + 1;
    message.life = existing.message.originLife || message.life || 2500;
    clear(existing.message);
    setTimeout(existing.closeCallback, 0);
  }
  if (!message.life) return;
  message.originLife = message.life;
  message.startTimestamp = Date.now();
  message.life = 0;
  messages.set(key, { message, closeCallback, timer: setTimeout(() => close(message, closeCallback), message.originLife) });
}
onBeforeUnmount(() => {
  for (const { timer } of messages.values()) clearTimeout(timer);
  messages.clear();
});
</script>

<template>
  <Toast position="top-center" unstyled :pt="root">
    <template #container="{ message, closeCallback }">
      <Badge v-if="!message.hide" :value="message.count" :class="['badge', message.severity]" size="small">
        <section class="alert" :class="{ 'alert--clickable': typeof message.onClick === 'function', 'alert--with-footer': !!message.footer }"
          :data-life="register(message, closeCallback)" :role="typeof message.onClick === 'function' ? 'button' : undefined"
          :tabindex="typeof message.onClick === 'function' ? 0 : undefined" @click="runAction(message, closeCallback)"
          @keydown="keyAction($event, message, closeCallback)" @mouseenter="pause(message)" @mouseleave="resume(message, closeCallback)">
          <div class="alert-icon"><component :is="icons[message.severity]" class="text-4 shrink-0" /></div>
          <div class="alert-content">
            <div class="alert-header"><template v-if="typeof message.summary === 'string'">{{ message.summary }}</template><component :is="message.summary" v-else /></div>
            <div v-if="message.detail" class="alert-message"><template v-if="typeof message.detail === 'string'">{{ message.detail }}</template><component :is="message.detail" v-else /></div>
          </div>
          <div class="alert-close"><CloseIcon class="text-4 shrink-0 cursor-pointer" @click.stop="close(message, closeCallback)" /></div>
          <div v-if="message.footer" class="alert-footer" @click.stop><component :is="message.footer" /></div>
        </section>
      </Badge>
    </template>
  </Toast>
</template>
