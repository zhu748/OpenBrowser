// One count request in flight, with at most one trailing refresh after a burst.
// No full profile DTOs, and no updates after the owning component unmounts.
export function createUsageCounter({ read, update, onError }) {
  let active, dirty = false, disposed = false;
  async function drain() {
    do {
      dirty = false;
      try {
        const value = await read();
        if (!Number.isSafeInteger(value?.count) || value.count < 0) throw Error("窗口用量响应无效");
        if (!disposed) update(value.count);
      } catch (error) { if (!disposed) onError(error); }
    } while (dirty && !disposed);
  }
  return {
    refresh() {
      if (disposed) return Promise.resolve();
      dirty = true;
      if (!active) active = drain().finally(() => { active = null; });
      return active;
    },
    dispose() { disposed = true; dirty = false; },
  };
}
