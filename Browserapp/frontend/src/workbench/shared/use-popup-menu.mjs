import { getCurrentInstance, h, nextTick, onUnmounted, ref } from './workbench-vue.js';
import { a as render } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import PopupMenu from './workbench-popup-menu.js';

function usePopupMenu() {
  const context = getCurrentInstance()?.appContext;
  if (!context) throw Error('usePopoverMenu must be used within a component setup');

  const menu = ref();
  let host;
  let revision = 0;

  function destroy() {
    revision++;
    if (!host) return;
    render(null, host);
    host.remove();
    host = undefined;
  }

  async function showMenu(event, { slots, ...options }) {
    const anchor = event.currentTarget ?? event.target;
    destroy();
    const request = revision;
    try {
      host = document.createElement('div');
      document.body.append(host);
      const node = h(() => h(PopupMenu, { ref: menu, ...options }, slots));
      node.appContext = context;
      render(node, host);
      await nextTick();

      if (request !== revision) return;
      if (!menu.value) throw Error('Menu component reference is not available');
      const trigger = new Proxy(event, {
        get(source, key) {
          return key === 'currentTarget' ? anchor : Reflect.get(source, key);
        },
      });
      menu.value.toggle(trigger);
    } catch (error) {
      if (request === revision) {
        console.error('Failed to show popup menu:', error);
        destroy();
      }
    }
  }

  onUnmounted(destroy);
  return { showMenu, destroy };
}

export { usePopupMenu as t };
