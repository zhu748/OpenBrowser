const fields = ["open", "port", "apiAllowLan"];
const settings = value => Object.fromEntries(fields.map(key => [key, value[key]]));
const equal = (a, b) => fields.every(key => a[key] === b[key]);

export function createApiSettingsWriter({ draft, saved, write, publish, failed }) {
  let previous = Promise.resolve();
  return () => {
    const operation = previous.then(async () => {
      const before = saved();
      const submitted = settings(draft());
      if (!before || equal(before, submitted)) return;
      let accepted;
      try {
        accepted = await write(submitted);
      } catch (error) {
        // Keep edits typed while the rejected request was in flight.
        failed(error);
      }
      const current = draft(), confirmed = accepted || saved();
      const next = Object.fromEntries(fields.map(key => [
        key, current[key] === submitted[key] ? confirmed[key] : current[key],
      ]));
      publish({ confirmed, submitted, next, accepted: Boolean(accepted) });
    });
    previous = operation.catch(() => {});
    return operation;
  };
}
