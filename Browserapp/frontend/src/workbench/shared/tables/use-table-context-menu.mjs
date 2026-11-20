import { createVNode, getCurrentInstance, nextTick, onUnmounted } from './workbench-vue.js';
import { a as render } from './runtime-dom.esm-bundler-_WxS4Zar.js';
import TableContextMenu from './workbench-table-context-menu.js';

let closePrevious;

export function useTableContextMenu() {
  const context = getCurrentInstance()?.appContext;
  let host;
  let menu;
  let revision = 0;

  function dispose() {
    revision++;
    if (host) {
      render(null, host);
      host.remove();
      host = undefined;
      menu = undefined;
    }
    if (closePrevious === dispose) closePrevious = undefined;
  }

  function show(event, props) {
    if (!context) return;
    closePrevious?.();
    closePrevious = dispose;
    const openRevision = revision;
    host = document.createElement('div');
    document.body.append(host);
    const node = createVNode(TableContextMenu, props);
    node.appContext = context;
    render(node, host);
    nextTick(() => {
      if (openRevision !== revision) return;
      menu = node.component?.exposed;
      menu?.show(event);
    });
  }

  onUnmounted(dispose);
  return [show, () => menu?.hide()];
}
