import { reactive, ref } from './workbench-vue.js';

const visible = ref(false);
const bounds = reactive({ top: 0, left: 0, width: 0, height: 0, borderRadius: '0px' });
let dispose;

function clearHighlight() {
  visible.value = false;
  dispose?.();
  dispose = undefined;
}

function highlight(locator) {
  clearHighlight();
  const find = () => typeof locator === 'function' ? locator() : document.querySelector(locator);
  const target = find();
  if (!target) return;
  function update() {
    const element = find();
    if (!element) return;
    const { top, left, width, height } = element.getBoundingClientRect();
    Object.assign(bounds, { top, left, width, height, borderRadius: getComputedStyle(element).borderRadius || '0px' });
  }
  visible.value = true;
  update();
  const scrollParents = [];
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    const { overflow, overflowX, overflowY } = getComputedStyle(parent);
    if ([overflow, overflowX, overflowY].some(value => /auto|scroll|overlay/.test(value))) scrollParents.push(parent);
  }
  window.addEventListener('scroll', update, true);
  window.addEventListener('resize', update);
  for (const parent of scrollParents) parent.addEventListener('scroll', update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(target);
  dispose = () => {
    observer.disconnect();
    window.removeEventListener('scroll', update, true);
    window.removeEventListener('resize', update);
    for (const parent of scrollParents) parent.removeEventListener('scroll', update);
  };
}

export { highlight as i, clearHighlight as t };
