'use strict';

const { spawn } = require('node:child_process');

async function within(promise, ms, message) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

function startFixtureProcess(binary, args) {
  const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let stderr = '';
  let spawnError;
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr = (stderr + chunk).slice(-8192); });
  child.on('error', error => { spawnError ??= error; });
  // Register at spawn: waiting for an event for the first time at teardown can
  // miss an already-closed child. A signal doesn't set child.exitCode.
  const closed = new Promise(resolve => child.once('close', resolve));
  const assertRunning = () => {
    if (spawnError) throw new Error(`Could not launch fixture browser: ${spawnError.message}`, { cause: spawnError });
    if (child.exitCode !== null || child.signalCode !== null) {
      const reason = child.signalCode ?? `exit code ${child.exitCode}`;
      throw new Error(`Fixture browser exited before readiness (${reason})${stderr ? `:\n${stderr.trimEnd()}` : ''}`);
    }
  };
  return {
    closed,
    assertRunning,
    diagnostics: () => stderr.trimEnd(),
    async close() {
      try {
        if (child.pid && child.exitCode === null && child.signalCode === null && !child.killed) child.kill('SIGKILL');
        await within(closed, 3000, 'Timed out waiting for fixture browser to close');
      } finally {
        child.stderr.destroy();
        child.unref();
      }
    },
  };
}

async function listenFixtureServer(server) {
  await within(new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  }), 3000, 'Timed out listening for fixture requests');
}

async function closeFixtureServer(server) {
  const closed = new Promise((resolve, reject) => server.close(error => {
    if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') reject(error);
    else resolve();
  }));
  server.closeAllConnections();
  await within(closed, 3000, 'Timed out waiting for fixture server to close');
}

module.exports = { closeFixtureServer, listenFixtureServer, startFixtureProcess };
