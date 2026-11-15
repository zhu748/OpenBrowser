'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');
const { receiverShadowSnapshot } = require('./fingerprint-receiver-probes');

async function inspect(page) {
  return h.evaluate(page, `(async () => {
    const frame = document.createElement('iframe');
    frame.src = '/frame';
    await new Promise(resolve => { frame.onload = resolve;document.body.append(frame); });
    try {
      const child = frame.contentWindow;
      const parentConnection = navigator.connection, childConnection = child.navigator.connection;
      const network = {};
      if (parentConnection && childConnection) {
        for (const key of ['rtt', 'downlink', 'effectiveType', 'saveData']) {
          const parentGet = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(parentConnection), key)?.get;
          const childGet = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(childConnection), key)?.get;
          if (!parentGet || !childGet) continue;
          network[key] = { parent: parentGet.call(parentConnection), child: childGet.call(childConnection),
            parentOnChild: parentGet.call(childConnection), childOnParent: childGet.call(parentConnection) };
          try { parentGet.call(Object.create(Object.getPrototypeOf(parentConnection)));network[key].forgedAccepted = true; }
          catch (error) { network[key].forgedError = error.name; }
        }
      }
      const errors = {};
      for (const key of ['userAgent', 'hardwareConcurrency']) {
        const getter = Object.getOwnPropertyDescriptor(Navigator.prototype, key).get;
        try { getter.call(Object.create(child.Navigator.prototype));errors[key] = { accepted: true }; }
        catch (error) { errors[key] = { name: error.name, parent: error instanceof TypeError, child: error instanceof child.TypeError }; }
        const childGetter = Object.getOwnPropertyDescriptor(child.Navigator.prototype, key).get;
        try { childGetter.call(Object.create(Navigator.prototype));errors['child:' + key] = { accepted: true }; }
        catch (error) { errors['child:' + key] = { name: error.name, parent: error instanceof TypeError, child: error instanceof child.TypeError }; }
      }
      const documentSnapshot = await (${receiverShadowSnapshot.toString()})();
      const workerSnapshot = await new Promise((resolve, reject) => {
        const source = '(' + ${JSON.stringify(receiverShadowSnapshot.toString())} + ')().then(postMessage)';
        const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        const worker = new Worker(url);
        const timer = setTimeout(() => finish(Error('Worker receiver probe timed out')), 8000);
        function finish(error, value) {
          clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);
          if (error) reject(error);else resolve(value);
        }
        worker.onmessage = event => finish(null, event.data);
        worker.onerror = event => finish(Error(event.message));
      });
      return { network, errors, documentSnapshot, workerSnapshot };
    } finally { frame.remove(); }
  })()`);
}

function verifyShadow(snapshot, label) {
  for (const [object, value] of Object.entries(snapshot)) {
    assert.equal(value.reads, 0, label + ' ' + object + ' cannot execute a constructor getter');
    assert.equal(value.applyReads, 0, label + ' ' + object + ' cannot use a page-writable apply function');
    assert.deepEqual(value.after, value.before, label + ' ' + object + ' retains native receiver semantics');
    if (value.forgery) assert.deepEqual(value.forgery, { errorName: 'TypeError', reads: 0 }, label + ' cannot promote a forged global navigator');
  }
}

async function main() {
  const browser = h.chooseChromiumBinary();
  const server = http.createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html');response.end('<!doctype html><body>receiver semantics');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let baseline;
  try {
    for (const injected of [false, true]) {
      const persona = h.buildPersona('receiver-native', { kernelVersion: browser.version,
        network: { rtt: 850, downlink: 1.3, effectiveType: '3g', saveData: true } });
      let session, page;
      try {
        session = await h.launchPersonaBrowser(browser, persona, { injectFingerprint: injected });
        page = await h.openPage(session.port, 'http://127.0.0.1:' + server.address().port + '/');
        await h.evaluate(page, 'new Promise(r => document.readyState === "complete" ? r() : addEventListener("load", r, {once:true}))');
        const result = await inspect(page);
        verifyShadow(result.documentSnapshot, 'document');
        verifyShadow(result.workerSnapshot, 'worker');
        if (!injected) { baseline = result;continue; }
        assert.deepEqual(result.errors, baseline.errors, 'borrowed getters throw errors from the native getter realm');
        for (const [key, value] of Object.entries(result.network)) {
          assert.equal(value.forgedAccepted, undefined);
          assert.equal(value.forgedError, 'TypeError');
          for (const direction of ['parent', 'child', 'parentOnChild', 'childOnParent'])
            assert.equal(value[direction], persona.fingerprint.connection[key], key + ' ' + direction + ' uses the profile identity');
        }
        assert.ok(Object.keys(result.network).length > 0, 'native NetworkInformation must be exercised');
        for (const snapshot of [result.documentSnapshot, result.workerSnapshot]) {
          assert.equal(snapshot.navigator.after.platform, persona.fingerprint.platform);
          assert.equal(snapshot.navigator.after.hardwareConcurrency, persona.fingerprint.hardwareConcurrency);
        }
      } finally { page?.close();await session?.close(); }
    }
  } finally { server.closeAllConnections();await new Promise(resolve => server.close(resolve)); }
  console.log('FINGERPRINT_RECEIVER_NATIVE_SELFTEST OK (native reference, cross-frame network getters, constructor shadowing and error realms)');
}

main().catch(error => {
  if (error instanceof h.Unavailable) { console.log('SKIP ' + error.message);process.exitCode = 2; }
  else { console.error(error);process.exitCode = 1; }
});
