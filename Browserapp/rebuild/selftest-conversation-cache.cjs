'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');

async function conversationCacheFixture(sourceFile) {
  const helpers = await import('./agent-conversation-cache.mjs');
  if (!sourceFile) {
    const state = { conversationsById: {}, messagesByConversationId: {}, runsById: {}, streamsByRunId: {},
      todoProgressByRunId: {}, pendingHitlByConversationId: {} };
    const recent = new Map();
    let selected = 'c0';
    const touch = (target, id) => helpers.touchConversationCache(target, id, {
      recent, maximum: 3, selected: () => selected, isActive: () => false, onEvict: () => {},
    });
    return { state, touch, recent, select: id => { selected = id; },
      detailLoader: fetchDetail => async id => {
        touch(state, id);
        const detail = await fetchDetail(id);
        helpers.cacheConversationMessages(state, id, detail.messages, touch);
      } };
  }
  // The benchmark can still compare an archived pre-source build.
  const source = await fs.readFile(sourceFile, 'utf8');
  const functions = ['Rm', 'zm', 'zl', 'Gm', 'qm', 'Xm', 'Zm', 'Qm', '$m'].map(name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = source.match(new RegExp('^function ' + escaped + '\\([^]*?^}', 'm'));
    if (name === 'Qm' && !match) return ''; // Its only old consumer was the archived eviction loop.
    assert.ok(match, 'compiled conversation-cache boundary changed: ' + name); return match[0];
  });
  const globals = { __router: { currentRoute: { value: { params: { conversationId: 'c0' } } } } };
  const result = new Function('evictConversationCache', 'touchConversationCache', 'globalThis', `
    const Ym=new Map(),km={},Jm=3,Mm={has:()=>false},Pm=new Map(),Fm={hasPending:()=>false};
    ${functions.join('\n')}
    return {state:Rm(),touch:$m,recent:Ym};
  `)(helpers.evictConversationCache, helpers.touchConversationCache, globals);
  result.select = id => { globals.__router.currentRoute.value.params.conversationId = id; };
  return result;
}

module.exports = { conversationCacheFixture };
