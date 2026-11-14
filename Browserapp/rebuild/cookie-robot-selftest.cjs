"use strict";
const fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const { CookieRobot, options } = require("./cookie-robot"),
  { BrowserEngine } = require("../engine"),
  { waitUntil } = require("./selftest-helpers.cjs");
(async () => {
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString("hex");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-robot-")),
    result = { status: "FAIL", checks: [] };
  const engine = new BrowserEngine({ getPath: () => root });
  let robot;
  try {
    await engine.init(null);
    await engine.syncProfiles([
      { id: "robot-test", name: "Robot", engine: "chromium", os: "Linux" },
    ]);
    const valid = {
      dirIds: ["robot-test"],
      robotParams: { cookieRobotUrls: ["http://127.0.0.1:1234/"] },
    };
    for (const payload of [
      { ...valid, dirIds: [] },
      { ...valid, dirIds: ["robot-test", "robot-test"] },
      { ...valid, robotParams: { cookieRobotUrls: ["javascript:alert(1)"] } },
      {
        ...valid,
        robotParams: { cookieRobotUrls: ["https://name:secret@example.test/"] },
      },
      {
        ...valid,
        robotParams: { ...valid.robotParams, scrollRange: [0, 100] },
      },
      { ...valid, robotParams: { ...valid.robotParams, delayRange: [2, 1] } },
      { ...valid, robotParams: { ...valid.robotParams, closeProfile: "yes" } },
      {
        ...valid,
        customParams: { startupParam: "--remote-debugging-port=9999" },
      },
      { ...valid, customParams: { arbitrary: true } },
    ])
      assert.throws(() => options(payload));
    assert.deepEqual(options(valid).scrollRange, [100, 500]);
    result.checks.push(
      "原 DTO 默认值和范围、URL/认证/启动参数/重复 ID 边界均检查",
    );
    robot = new CookieRobot({ engine, root });
    let launches = 0;
    engine.start = async () => {
      launches++;
      throw Error("unit test must never launch a browser");
    };
    await assert.rejects(
      robot.request("start", { ...valid, dirIds: ["robot-test", "missing"] }),
      /not found/,
    );
    assert.equal(launches, 0);
    assert.equal((await robot.request("list")).length, 0);
    result.checks.push("末行不存在时整批拒绝，没有任务记录、没有浏览器启动");
    let release, entered;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const enteredGate = new Promise((resolve) => {
      entered = resolve;
    });
    const persist = robot.save.bind(robot);
    let first = true;
    robot.save = async () => {
      if (first) {
        first = false;
        entered();
        await gate;
      }
      return persist();
    };
    const starting = robot.request("start", valid);
    await enteredGate;
    const closing = robot.shutdown();
    setTimeout(release, 20);
    await Promise.all([starting, closing]);
    assert.equal(launches, 0);
    assert.equal(robot.active.size, 0);
    assert.equal((await robot.request("list"))[0].status, "cancelled");
    result.checks.push(
      "初次落盘未完成时退出仍让 I/O 前进，预留任务取消且没有启动浏览器",
    );
    robot.records.push({ id: "interrupted", status: "running", pages: [] });
    await persist();
    const restarted = new CookieRobot({ engine, root });
    assert.equal(
      (await restarted.request("list")).find((row) => row.id === "interrupted")
        .status,
      "interrupted",
    );
    assert.equal(restarted.active.size, 0);
    const encrypted = await fs.readFile(
      path.join(root, "cookie-robot/jobs.enc"),
    );
    assert.ok(!encrypted.includes(Buffer.from("127.0.0.1:1234")));
    await waitUntil(() => robot.active.size === 0);
    result.checks.push(
      "记录加密并能重读；进程中断任务明确标记 interrupted，不自动重放网址",
    );
    result.status = "PASS";
  } finally {
    await robot?.shutdown();
    await engine.flushPersistence();
    await fs.writeFile(
      path.join(
        __dirname,
        "../../docs/rebuild/evidence/cookie-robot-selftest.json",
      ),
      JSON.stringify(result, null, 2),
    );
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
