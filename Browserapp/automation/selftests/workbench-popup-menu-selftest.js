'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-popup-menu-'));
  const hosts = new Set(), unmounts = [], toggled = [];
  globalThis.document = {
    createElement: () => ({ remove() { hosts.delete(this); } }),
    body: { append(host) { hosts.add(host); } },
  };
  const fixture = globalThis.popupFixture = {
    unmounts, nextTick: () => Promise.resolve(),
    render(node) {
      if (node) node.type().props.ref.value = { toggle: event => toggled.push(event.currentTarget) };
    },
  };
  try {
    const source = path.resolve(__dirname, '../../frontend/src/workbench/shared/use-popup-menu.mjs');
    const file = path.join(root, 'use-popup-menu.mjs');
    await Promise.all([
      fs.copyFile(source, file),
      fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}'),
      fs.writeFile(path.join(root, 'workbench-vue.js'), `
        export const getCurrentInstance = () => ({ appContext: {} }), h = (type, props) => ({ type, props }),
          ref = value => ({ value }), onUnmounted = callback => popupFixture.unmounts.push(callback),
          nextTick = () => popupFixture.nextTick();
      `),
      fs.writeFile(path.join(root, 'runtime-dom.esm-bundler-_WxS4Zar.js'), 'export const a = node => popupFixture.render(node);'),
      fs.writeFile(path.join(root, 'workbench-popup-menu.js'), 'export default {};'),
    ]);
    const { t: usePopupMenu } = await import(pathToFileURL(file).href);
    const menu = usePopupMenu();
    const oldAnchor = { isConnected: true };
    const oldEvent = { currentTarget: oldAnchor, target: oldAnchor };
    // Simulate a load settling after the menu owner leaves the route.
    unmounts.shift()();
    await menu.showMenu(oldEvent, {});
    assert.equal(hosts.size, 0, 'late response must not create an orphan popup');
    assert.deepEqual(toggled, []);

    const live = usePopupMenu();
    oldAnchor.isConnected = false;
    await live.showMenu(oldEvent, {});
    assert.equal(hosts.size, 0, 'disconnected anchor must not open a popup');
    const anchor = { isConnected: true };
    const event = { currentTarget: anchor, target: anchor };
    let resume;
    fixture.nextTick = () => new Promise(resolve => { resume = resolve; });
    const pending = live.showMenu(event, {});
    assert.equal(hosts.size, 1);
    anchor.isConnected = false;
    resume();
    await pending;
    assert.equal(hosts.size, 0, 'anchor detached during nextTick must clean up the pending host');
    assert.deepEqual(toggled, []);

    anchor.isConnected = true;
    const reopened = live.showMenu(event, {});
    event.currentTarget = null; // A native click clears currentTarget after dispatch.
    resume();
    await reopened;
    assert.deepEqual(toggled, [anchor], 'live popups still remember their original anchor');
    live.destroy();
    assert.equal(hosts.size, 0);
    const reused = live.showMenu(event, {});
    resume();
    await reused;
    assert.deepEqual(toggled, [anchor, anchor], 'manual dismissal does not permanently dispose the menu');
    unmounts.shift()();
    assert.equal(hosts.size, 0);
    console.log('WORKBENCH_POPUP_MENU_SELFTEST OK (late calls, detached anchors, captured and reusable popup)');
  } finally {
    delete globalThis.document;
    delete globalThis.popupFixture;
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
