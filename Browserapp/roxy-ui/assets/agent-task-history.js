function createTaskHistory({ read, exists, publish, drop, busy, onError, maximum = 12 }) {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 100) throw Error("Invalid task detail cache limit");
  const pending = /* @__PURE__ */ new Map(), loaded = /* @__PURE__ */ new Map(), dirty = /* @__PURE__ */ new Set();
  let selected;
  const updateBusy = () => busy(!!(selected && pending.has(selected)));
  function remove(id) {
    pending.delete(id), loaded.delete(id), dirty.delete(id), drop(id), selected === id && (selected = void 0), updateBusy();
  }
  function load(id) {
    if (pending.has(id)) return pending.get(id);
    const promise = Promise.resolve().then(() => read(id)).then((value) => {
      if (pending.get(id) !== promise || !exists(id)) return null;
      if (value?.taskLogId !== id || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Array.isArray(value.messages))
        throw Error("\u4EFB\u52A1\u65E5\u5FD7\u8BE6\u60C5\u54CD\u5E94\u65E0\u6548");
      for (publish(id, value), loaded.delete(id), loaded.set(id, !0); loaded.size > maximum; ) {
        const oldest = loaded.keys().next().value;
        if (oldest === selected) {
          loaded.delete(oldest), loaded.set(oldest, !0);
          continue;
        }
        loaded.delete(oldest), drop(oldest);
      }
      return value;
    }).finally(() => {
      pending.get(id) === promise && (pending.delete(id), updateBusy(), dirty.delete(id) && selected === id && exists(id) && load(id).catch(onError));
    });
    return pending.set(id, promise), updateBusy(), promise;
  }
  return {
    has: (id) => loaded.has(id),
    isLoading: (id) => pending.has(id),
    async select(id) {
      selected = id, updateBusy();
      const value = await load(id);
      return selected === id ? value : null;
    },
    clearSelection() {
      selected = void 0, updateBusy();
    },
    remove,
    refresh(id) {
      selected === id && (pending.has(id) ? dirty.add(id) : load(id).catch(onError));
    },
    reset() {
      pending.clear(), loaded.clear(), dirty.clear(), busy(!1);
    },
    reconnect() {
      selected && exists(selected) && load(selected).catch(onError);
    }
  };
}
export {createTaskHistory as createTaskHistory};