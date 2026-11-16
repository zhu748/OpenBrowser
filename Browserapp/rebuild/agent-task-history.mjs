// Keep a bounded cache of details explicitly opened by the user. Reconnection
// and task-list refreshes fetch summaries; only the selected detail is reloaded.
export function createTaskHistory({ read, exists, publish, drop, busy, onError, maximum = 12 }) {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 100) throw Error("Invalid task detail cache limit");
  const pending = new Map(), loaded = new Map(), dirty = new Set();
  let selected;
  const updateBusy = () => busy(Boolean(selected && pending.has(selected)));
  function remove(id) {
    pending.delete(id); loaded.delete(id); dirty.delete(id); drop(id);
    if (selected === id) selected = undefined;
    updateBusy();
  }
  function load(id) {
    if (pending.has(id)) return pending.get(id);
    const promise = Promise.resolve().then(() => read(id)).then(value => {
      if (pending.get(id) !== promise || !exists(id)) return null;
      if (value?.taskLogId !== id || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Array.isArray(value.messages))
        throw Error("任务日志详情响应无效");
      publish(id, value);
      loaded.delete(id); loaded.set(id, true);
      while (loaded.size > maximum) {
        const oldest = loaded.keys().next().value;
        if (oldest === selected) { loaded.delete(oldest); loaded.set(oldest, true); continue; }
        loaded.delete(oldest); drop(oldest);
      }
      return value;
    }).finally(() => {
      if (pending.get(id) !== promise) return;
      pending.delete(id);
      updateBusy();
      if (dirty.delete(id) && selected === id && exists(id)) void load(id).catch(onError);
    });
    pending.set(id, promise); updateBusy();
    return promise;
  }
  return {
    has: id => loaded.has(id),
    isLoading: id => pending.has(id),
    async select(id) {
      selected = id;
      updateBusy();
      const value = await load(id);
      return selected === id ? value : null;
    },
    clearSelection() { selected = undefined; updateBusy(); },
    remove,
    refresh(id) {
      if (selected !== id) return;
      if (pending.has(id)) dirty.add(id);
      else void load(id).catch(onError);
    },
    reset() { pending.clear(); loaded.clear(); dirty.clear(); busy(false); },
    reconnect() { if (selected && exists(selected)) void load(selected).catch(onError); },
  };
}
