'use strict';

const assert = require('node:assert/strict');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { browserTool, browserCapabilities } = require('../../rebuild/agent-browser-tools');
const h = require('./native-gate-harness');

async function main() {
  const binary = h.chooseChromiumBinary();
  const executablePath = path.isAbsolute(binary.binary) ? binary.binary
    : process.env.PATH.split(path.delimiter).map(directory => path.join(directory, binary.binary)).find(file => fs.existsSync(file));
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const browser = await chromium.launch({ executablePath, headless: true,
    args: ['--no-sandbox', '--remote-debugging-port=' + port] });
  const connect = chromium.connectOverCDP.bind(chromium);
  try {
    const page = await browser.newPage();
    await page.setContent('<body><script>window.clicked=0</script></body>');
    const engine = { running: new Map([['test', { port, engine: 'chromium' }]]) };
    for (const name of ['click', 'fill']) {
      let entered;
      const waiting = new Promise(resolve => { entered = resolve; });
      // Signal the start of the real locator auto-wait, without relying on
      // sleep timing or replacing the browser operation with a mock.
      chromium.connectOverCDP = async (...args) => {
        const client = await connect(...args);
        for (const context of client.contexts()) for (const target of context.pages()) {
          const locator = target.locator.bind(target);
          target.locator = (...selector) => {
            const actual = locator(...selector), action = actual[name].bind(actual);
            actual[name] = (...values) => { const pending = action(...values); entered(); return pending; };
            return actual;
          };
        }
        return client;
      };
      const run = { abort: new AbortController() }, reason = Error('user cancelled');
      const operation = browserTool(engine, name, { id: 'test', selector: '#delayed', value: 'unwanted' }, run);
      operation.catch(() => {});
      await waiting;
      run.abort.abort(reason);
      await assert.rejects(operation, error => error === reason);
      await page.evaluate(() => {
        const b = document.createElement('input'); b.id = 'delayed'; b.onclick = () => window.clicked++;
        document.body.append(b);
      });
      await page.waitForTimeout(250);
      assert.equal(await page.evaluate(() => window.clicked), 0);
      assert.equal(await page.locator('#delayed').inputValue(), '');
      await page.locator('#delayed').evaluate(element => element.remove());
      assert.ok(browser.isConnected(), 'cancellation must not close the user browser');
    }
    chromium.connectOverCDP = connect;
    assert.deepEqual(browserCapabilities('firefox').browserTools, []);
    assert.ok(browserCapabilities('chromium').browserTools.includes('navigate'));
    const aborted = { abort: new AbortController() }; aborted.abort.abort();
    await assert.rejects(browserTool(engine, 'click', { id: 'test', selector: 'body' }, aborted), { name: 'AbortError' });
    console.log('PASS AGENT_BROWSER_CANCELLATION (real click/fill waits stop, later elements untouched, browser retained, capabilities)');
  } finally { chromium.connectOverCDP = connect; await browser.close(); }
}

main().catch(error => {
  console.error((error instanceof h.Unavailable ? 'SKIP ' : 'FAIL ') + error.stack);
  process.exitCode = error instanceof h.Unavailable ? 2 : 1;
});
