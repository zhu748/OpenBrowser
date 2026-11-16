function createUsageCounter({ read, update, onError }) {
  let active, dirty = !1, disposed = !1;
  async function drain() {
    do {
      dirty = !1;
      try {
        const value = await read();
        if (!Number.isSafeInteger(value?.count) || value.count < 0) throw Error("\u7A97\u53E3\u7528\u91CF\u54CD\u5E94\u65E0\u6548");
        disposed || update(value.count);
      } catch (error) {
        disposed || onError(error);
      }
    } while (dirty && !disposed);
  }
  return {
    refresh() {
      return disposed ? Promise.resolve() : (dirty = !0, active || (active = drain().finally(() => {
        active = null;
      })), active);
    },
    dispose() {
      disposed = !0, dirty = !1;
    }
  };
}
export {createUsageCounter as createUsageCounter};