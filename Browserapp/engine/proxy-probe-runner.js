'use strict';

async function runProxyProbes(tasks, { totalTimeoutMs = 6500, attemptTimeoutMs = 2200,  } = {}) {
  // Providers run concurrently with a shared total deadline: the old serial
  // loop paid up to attemptTimeoutMs per provider (6 geo sources ~= worst
  // case 13s tail) while a healthy lookup only ever needs the fastest one.
  // Semantics preserved: first value with ip+countryCode wins (FIFO order of
  // the task list), a link error aborts the cycle as a real proxy failure.
  const deadline = Date.now() + totalTimeoutMs;
  const values = [];
  const errors = [];

  const attempts = tasks.map((task, index) => new Promise((resolve) => {
    const controller = new AbortController();
    const timeoutError = Object.assign(
      new Error('Proxy probe deadline exceeded'),
      { code: 'probe-unavailable', probeUnavailable: true }
    );
    const settle = (slot) => {
      clearTimeout(slot.timer);
      controller.abort();
      resolve(slot);
    };
    const timer = setTimeout(
      () => settle({ error: timeoutError, index }),
      Math.min(attemptTimeoutMs, Math.max(0, deadline - Date.now()))
    );
    if (timer.unref) timer.unref();
    Promise.resolve()
      .then(() => task(controller.signal))
      .then((value) => settle({ value, index }))
      .catch((error) => settle({ error, index }));
  }));

  const settled = await Promise.all(attempts);
  settled.sort((a, b) => a.index - b.index);
  for (const slot of settled) {
    if (slot.error) { errors.push(slot.error); continue; }
    if (slot.value?.ip) values.push(slot.value);
  }
  values.errors = errors;
  return values;
}

module.exports = { runProxyProbes };
