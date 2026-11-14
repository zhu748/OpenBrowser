"use strict";
const fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { BrowserEngine } = require("../engine"),
  { LocalService } = require("./local-service");
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-cache-"));
  let service;
  try {
    const engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    service = new LocalService({
      engine,
      root,
      dialog: {},
      window: () => null,
    });
    const first = await service.request("profiles:create", {
        windowName: "缓存一",
        os: "Linux",
        cookie: '[{"name":"keep","value":"cookie","domain":"example.com"}]',
      }),
      second = await service.request("profiles:create", {
        windowName: "缓存二",
        os: "Linux",
        coreType: "Firefox",
      });
    const dir = engine.profileRoot(first.id),
      fox = engine.profileRoot(second.id);
    const put = async (file, value = "keep") => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, value);
    };
    const exists = async (file) =>
      !!(await fs.stat(file).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      }));
    const cache = path.join(dir, "Default/Cache/data"),
      cookies = path.join(dir, "Default/Network/Cookies"),
      extension = path.join(dir, "Default/Local Extension Settings/ext/data"),
      login = path.join(dir, "Default/Login Data");
    await put(cache);
    await put(cookies);
    await put(extension);
    await put(login);
    await service.request("profiles:clear-cache", {
      dirIds: [first.id],
      clearType: "partial",
    });
    assert.equal(await exists(cache), false);
    assert.ok(await exists(extension));
    assert.ok(await exists(cookies));
    await put(cache);
    await service.request("profiles:clear-cache", {
      dirIds: [first.id],
      clearType: "all",
    });
    assert.equal(await exists(extension), false);
    assert.ok(await exists(cookies));
    assert.ok(await exists(login));
    assert.ok(engine.profiles.get(first.id).cookies.includes("cookie"));
    await put(cache);
    engine.running.set(second.id, {});
    await assert.rejects(
      service.request("profiles:clear-cache", {
        dirIds: [first.id, second.id],
        clearType: "partial",
      }),
      (error) => error.code === "PROFILE_BUSY",
    );
    engine.running.delete(second.id);
    assert.ok(await exists(cache));
    await fs.mkdir(fox, { recursive: true });
    await put(path.join(fox, "cache2/data"));
    await put(path.join(fox, "cookies.sqlite"));
    await put(path.join(fox, "browser-extension-data/ext/data"));
    await service.request("profiles:clear-cache", {
      dirIds: [second.id],
      clearType: "all",
    });
    assert.equal(await exists(path.join(fox, "cache2/data")), false);
    assert.equal(
      await exists(path.join(fox, "browser-extension-data/ext/data")),
      false,
    );
    assert.ok(await exists(path.join(fox, "cookies.sqlite")));
    if (process.platform !== "win32") {
      await fs.rm(fox, { recursive: true });
      const outside = path.join(root, "outside");
      await put(path.join(outside, "cache2/do-not-delete"));
      await fs.symlink(outside, fox);
      await assert.rejects(
        service.request("profiles:clear-cache", {
          dirIds: [first.id, second.id],
          clearType: "partial",
        }),
        /Isolation/,
      );
      assert.ok(await exists(cache));
      assert.ok(await exists(path.join(outside, "cache2/do-not-delete")));
    }
    await assert.rejects(
      service.request("profiles:clear-cache", {
        dirIds: [first.id],
        clearType: "cloud",
      }),
      /无效/,
    );
    const evidence = {
      status: "PASS",
      checks: [
        "actual Chromium and Firefox cache directories removed via native helpers",
        "partial preserves extension state; all clears extension state while preserving Cookies/Login Data and profile Cookie",
        "whole-selection busy/realpath checks prevent partial deletion and path escape",
        "cloud mode rejected; no cloud cleanup implementation",
      ],
    };
    await fs.writeFile(
      path.resolve(
        __dirname,
        "../../docs/rebuild/evidence/profile-cache-selftest.json",
      ),
      JSON.stringify(evidence, null, 2),
    );
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    await service?.agent?.shutdown();
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
