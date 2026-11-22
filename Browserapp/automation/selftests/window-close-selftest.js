'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createWindowCloseHandler } = require('../../main/window-close');

function setup({ platform = 'linux', preference = 'ask', ask } = {}) {
  let quitting = false;
  let destroyed = false;
  let pendingAsk = Promise.withResolvers();
  const calls = { asks: 0, hides: 0, closes: 0, remembered: [] };
  const win = {
    isDestroyed: () => destroyed,
    close() {
      calls.closes++;
      assert.equal(requestClose().prevented, false, 'confirmed exit must pass the close handler');
    },
  };
  const handler = createWindowCloseHandler(win, {
    platform,
    isQuitting: () => quitting,
    readPreference: () => preference,
    ask() { calls.asks++; return ask ? ask() : pendingAsk.promise; },
    hide() { calls.hides++; },
    remember(mode) { calls.remembered.push(mode); },
  });
  function requestClose() {
    const result = { prevented: false };
    result.pending = handler({ preventDefault() { result.prevented = true; } });
    return result;
  }
  return {
    calls, requestClose,
    resolve(mode, remember = false) { pendingAsk.resolve({ mode, remember }); pendingAsk = Promise.withResolvers(); },
    quit() { quitting = true; },
    destroy() { destroyed = true; },
  };
}

test('concurrent close clicks share one prompt and perform its choice once', async () => {
  const fixture = setup();
  const first = fixture.requestClose();
  await Promise.resolve();
  const second = fixture.requestClose();
  assert.ok(first.prevented && second.prevented);
  assert.equal(first.pending, second.pending);
  assert.equal(fixture.calls.asks, 1);
  fixture.resolve('tray', true);
  await first.pending;
  assert.deepEqual(fixture.calls, { asks: 1, hides: 1, closes: 0, remembered: ['tray'] });

  const next = fixture.requestClose();
  await Promise.resolve();
  fixture.resolve('exit');
  await next.pending;
  assert.equal(fixture.calls.closes, 1);
  assert.equal(fixture.calls.asks, 2);
});

test('application quit and destroyed windows ignore a late prompt result', async () => {
  for (const stop of ['quit', 'destroy']) {
    const fixture = setup();
    const first = fixture.requestClose();
    await Promise.resolve();
    fixture[stop]();
    if (stop === 'quit') assert.equal(fixture.requestClose().prevented, false);
    fixture.resolve('tray', true);
    await first.pending;
    assert.deepEqual(fixture.calls, { asks: 1, hides: 0, closes: 0, remembered: [] });
  }
});

test('known preferences and macOS bypass the prompt; a failed prompt allows retry', async () => {
  assert.equal(setup({ platform: 'darwin' }).requestClose().prevented, false);
  assert.equal(setup({ preference: 'exit' }).requestClose().prevented, false);
  const tray = setup({ preference: 'tray' });
  assert.ok(tray.requestClose().prevented);
  assert.equal(tray.calls.hides, 1);
  const failure = setup({ ask() { throw Error('dialog unavailable'); } });
  await failure.requestClose().pending;
  await failure.requestClose().pending;
  assert.deepEqual(failure.calls, { asks: 2, hides: 2, closes: 0, remembered: [] });
});
