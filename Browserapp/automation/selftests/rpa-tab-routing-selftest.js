'use strict';

const assert = require('node:assert/strict');
const cdp = require('../../cdp');
const { RpaEngine } = require('../rpa-engine');

async function main() {
  const originals = { tabs: cdp.tabs, call: cdp.call, navigate: cdp.navigate, reload: cdp.reload };
  const calls = [];
  cdp.tabs = async () => [
    { id: 'first', url: 'https://first.test', webSocketDebuggerUrl: 'ws://first' },
    { id: 'selected', url: 'https://selected.test', webSocketDebuggerUrl: 'ws://selected' },
  ];
  cdp.call = async (ws, method, params) => { calls.push({ ws, method, params }); return {}; };
  cdp.navigate = async () => { throw new Error('unscoped navigate targets the first tab'); };
  cdp.reload = async () => { throw new Error('unscoped reload targets the first tab'); };
  try {
    const rpa = new RpaEngine({ engine: {}, store: null, emit() {} });
    const ctx = { variables: {}, activeTabId: 'selected' };
    await rpa.executeStep(1, { type: 'goto', url: 'https://destination.test' }, ctx);
    await rpa.executeStep(1, { type: 'reload' }, ctx);
    await rpa.executeStep(1, { type: 'goback', timeout: 1 }, ctx);
    assert.deepEqual(calls.map(({ ws, method }) => [ws, method]), [
      ['ws://selected', 'Page.navigate'], ['ws://selected', 'Page.reload'], ['ws://selected', 'Runtime.evaluate'],
    ]);
    assert.equal(calls[0].params.url, 'https://destination.test');

    rpa.engine = { profiles: new Map([['other', { id: 'other', number: 2 }]]), start: async () => ({ port: 2 }) };
    const execute = rpa.executeStep;
    rpa.executeStep = async (_port, _step, childContext) => {
      assert.equal(childContext.activeTabId, null, 'another profile cannot inherit the previous tab');
      childContext.activeTabId = 'child-tab';
      throw new Error('child failure');
    };
    ctx.port = 1; ctx.activeProfileId = 'original';
    await assert.rejects(execute.call(rpa, 1, {
      type: 'openNewBrowser', accounts: '2', children: [{ type: 'noop' }],
    }, ctx), /child failure/);
    assert.equal(ctx.activeTabId, 'selected', 'profile scope restores its selected tab on failure');
    assert.equal(ctx.port, 1);
    assert.equal(ctx.activeProfileId, 'original');
    console.log('RPA_TAB_ROUTING_SELFTEST OK');
  } finally { Object.assign(cdp, originals); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
