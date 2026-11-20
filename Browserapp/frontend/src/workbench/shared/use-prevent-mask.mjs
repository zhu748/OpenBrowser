import { onBeforeUnmount } from './workbench-vue.js';

let mask;
const clients = new Set();

function getMask() {
  if (!mask) {
    mask = document.createElement('div');
    mask.id = '__prevent-mask-overlay__';
    Object.assign(mask.style, { display: 'none', position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0)', zIndex: '10', pointerEvents: 'auto' });
    document.body.append(mask);
  }
  return mask;
}

function usePreventMask() {
  const owner = Symbol();
  function showPreventMask() {
    clients.add(owner);
    getMask().style.display = 'block';
  }
  function hidePreventMask() {
    clients.delete(owner);
    if (mask && !clients.size) mask.style.display = 'none';
  }
  onBeforeUnmount(hidePreventMask);
  return { showPreventMask, hidePreventMask };
}

export { usePreventMask as t };
