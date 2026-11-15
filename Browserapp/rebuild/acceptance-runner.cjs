"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const { workbenchTests } = require("../scripts/workbench-test-registry");
const { classifySelftestResult } = require("../scripts/selftest-status");
const { runtimeSnapshot } = require("./compiler/runtime-snapshot.cjs");
const repo = path.resolve(__dirname, "../..");
const evidence = path.join(repo, "docs/rebuild/evidence");
const hash = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function options(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === "--list") result.list = true;
    else if (
      flag === "--runtime" &&
      ["node", "electron", "chromium", "firefox"].includes(argv[index + 1])
    )
      result.runtime = argv[++index];
    else if (flag === "--output" && argv[index + 1])
      result.output = path.resolve(repo, argv[++index]);
    else
      throw Error(
        "Usage: acceptance-runner.cjs [--list] [--runtime node|electron|chromium|firefox] [--output directory]",
      );
  }
  return result;
}

function preserveAttempt(file) {
  if (!fs.existsSync(file)) return;
  const previous = JSON.parse(fs.readFileSync(file, "utf8"));
  const output = path.dirname(file);
  const folder = path.join(
    output,
    "acceptance-attempts",
    Date.now() + "-" + crypto.randomUUID().slice(0, 8),
  );
  fs.mkdirSync(folder, { recursive: true });
  for (const row of previous.results || []) {
    const source = path.resolve(repo, row.log);
    if (!source.startsWith(output + path.sep)) throw Error("历史日志路径越界");
    if (fs.existsSync(source)) {
      const destination = path.join(folder, path.basename(source));
      fs.copyFileSync(source, destination);
      row.log = path.relative(repo, destination);
    }
  }
  fs.writeFileSync(
    path.join(folder, "commands.json"),
    JSON.stringify(previous, null, 2),
  );
}

async function runTest(test, output) {
  const source = path.join(repo, "Browserapp", test.script);
  const testSha256 = hash(source);
  const logPath = path.join(output, "commands", test.file + ".log");
  const fd = fs.openSync(logPath, "w");
  const started = Date.now();
  const env = { ...process.env };
  if (!test.file.startsWith("local-api")) env.OPENBROWSER_API_PORT = "0";
  let outcome;
  try {
    outcome = await new Promise((resolve) => {
      const child = spawn(process.execPath, [test.script], {
        cwd: path.join(repo, "Browserapp"),
        env,
        stdio: ["ignore", fd, fd],
        timeout: test.timeoutMs,
        killSignal: "SIGTERM",
      });
      child.once("error", (error) =>
        resolve({ exitCode: null, error: error.message }),
      );
      child.once("close", (exitCode, signal) => resolve({ exitCode, signal }));
    });
  } finally {
    fs.closeSync(fd);
  }
  const testSourceUnchanged = hash(source) === testSha256;
  const classification = classifySelftestResult({
    status: outcome.exitCode,
    signal: outcome.signal,
    error: outcome.error,
    stdout: fs.readFileSync(logPath, "utf8"),
  });
  const statuses = { passed: "PASS", partial: "PARTIAL", skipped: "SKIP", failed: "FAIL" };
  return {
    name: test.file,
    command: "node " + test.script,
    runtime: test.runtime,
    log: path.relative(repo, logPath),
    ...outcome,
    status: testSourceUnchanged ? statuses[classification] : "FAIL",
    durationMs: Date.now() - started,
    testSha256,
    testSourceUnchanged,
  };
}

async function main(argv) {
  const config = options(argv);
  const tests = workbenchTests.filter(
    (test) => !config.runtime || test.runtime === config.runtime,
  );
  if (config.list) {
    for (const test of tests)
      console.log(
        `${test.runtime.padEnd(9)} ${test.script} (${test.timeoutMs} ms)`,
      );
    return;
  }
  const output = config.output || evidence;
  fs.mkdirSync(path.join(output, "commands"), { recursive: true });
  const file = path.join(output, "phase4-command-results.json");
  preserveAttempt(file);
  const record = {
    status: "RUNNING",
    startedAt: new Date().toISOString(),
    scope: "按当前运行目录逐项真实回归；日志保留，失败继续收集其余结果。",
    runtime: config.runtime || "all",
    results: [],
    runtimeAtStart: runtimeSnapshot(),
  };
  const save = () => fs.writeFileSync(file, JSON.stringify(record, null, 2));
  save();
  try {
    for (const test of tests) {
      console.log("RUN " + test.file);
      const result = await runTest(test, output);
      record.results.push(result);
      save();
      console.log(result.status + " " + test.file);
    }
    record.endedAt = new Date().toISOString();
    record.runtimeAtEnd = runtimeSnapshot();
    record.runtimeUnchanged =
      record.runtimeAtStart.sha256 === record.runtimeAtEnd.sha256;
    record.status = !record.runtimeUnchanged || record.results.some((row) => row.status === "FAIL")
      ? "FAIL" : record.results.every((row) => row.status === "PASS") ? "PASS" : "PARTIAL";
  } catch (error) {
    record.status = "FAIL";
    record.failure = error.stack;
    throw error;
  } finally {
    save();
  }
  console.log(
    `${record.status} ${record.results.length} commands (${record.runtime})`,
  );
  if (record.status !== "PASS") process.exitCode = 1;
}

module.exports = { options, runTest };
if (require.main === module)
  main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
