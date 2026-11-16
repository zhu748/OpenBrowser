'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

// Execute the actual generated cache entry points with plain state and no Vue
// rendering. Desktop tests separately cover their component lifecycle wiring.
async function conversationCacheFixture(sourceFile = path.join(__dirname, '../roxy-ui/assets/hook-CnJE4hRq.js')) {
  const helpers = await import('./agent-conversation-cache.mjs');
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
  result.detailLoader = fetchDetail => {
    const detail = [...source.matchAll(/^  async function Pe2\([^]*?^  }/gm)].map(match => match[0])
      .find(value => value.includes('agent-console:loadConversationDetail'));
    assert.ok(detail, 'compiled detail lifecycle boundary changed');
    return new Function('state', 'touch', 'fetchDetail', `
      const e2=state,t2={conversationDetail:fetchDetail},bm=new Set(),_m=5,km={},Fm={hasRun:()=>false};
      const $m=touch,j=()=>()=>{},je2=id=>!Object.hasOwn(e2.messagesByConversationId,id),Ne2=async value=>value;
      const qf=value=>value,ke2=value=>{e2.conversationsById[value.id]=value;},Jf=value=>value.messages;
      ${detail}
      return Pe2;
    `)(result.state, result.touch, fetchDetail);
  };
  return result;
}

module.exports = { conversationCacheFixture };
