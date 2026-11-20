"use strict";

const path = require("node:path");
const appRoot = path.resolve(__dirname, "..");

async function installReference(app, assets) {
  await app.evaluate(({ protocol, net }, options) => {
    const load = process.mainModule.require.bind(process.mainModule);
    const { installUiProtocol, CSP } = load(options.protocol);
    let serve;
    installUiProtocol({ handle: (_scheme, handler) => { serve = handler; } }, net, options.runtime);
    globalThis.__workbenchReferenceRequests = new Set();
    globalThis.__workbenchSourceRequests = new Set();
    protocol.unhandle("obui");
    protocol.handle("obui", async request => {
      const url = new URL(request.url);
      const asset = url.pathname.slice("/assets/".length);
      if (url.hostname === "app" && url.pathname.startsWith("/assets/") && Object.hasOwn(options.assets, asset)) {
        if (globalThis.__workbenchReference) {
          globalThis.__workbenchReferenceRequests.add(asset);
          return new Response(options.assets[asset], { headers: {
            "Content-Type": "text/javascript; charset=utf-8", "Content-Security-Policy": CSP, "Cache-Control": "no-store",
          } });
        }
        globalThis.__workbenchSourceRequests.add(asset);
      }
      const response = await serve(request);
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      return new Response(response.body, { status: response.status, headers });
    });
  }, {
    assets,
    protocol: path.join(__dirname, "protocol.js"),
    runtime: path.join(appRoot, "roxy-ui"),
  });
}

async function readReferenceRequests(app) {
  return app.evaluate(() => [...globalThis.__workbenchReferenceRequests].sort());
}

async function readSourceRequests(app) {
  return app.evaluate(() => [...globalThis.__workbenchSourceRequests].sort());
}

async function switchReferenceMode(app, reference) {
  await app.evaluate(async ({ session }, enabled) => {
    globalThis.__workbenchReference = enabled;
    await session.defaultSession.clearCache();
  }, reference);
}

async function disableReferenceCache(page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
}

module.exports = { installReference, readReferenceRequests, readSourceRequests, switchReferenceMode, disableReferenceCache };
