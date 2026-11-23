const profileTables = new Set(["browser-list", "browser-recycle-list"]);

export function isProfileTable(key) { return profileTables.has(key); }

let profileCacheVersion = 0;
export function invalidateProfileTableCache() { profileCacheVersion += 1; }
export function listCacheVersion(key) { return isProfileTable(key) ? profileCacheVersion : undefined; }

export function sortDirection(value) {
  return value ? { 1: 'asc', '-1': 'desc', asc: 1, desc: -1 }[String(value)] : undefined;
}

export function buildTableQuery({ first, pageSize, filters, tableParams, runtimeParams, sortField, sortOrder }) {
  const query = {
    page_index: Math.ceil(first / pageSize) + 1, page_size: pageSize,
    ...filters, ...tableParams, ...runtimeParams,
  };
  if (sortField) {
    query.orderName = sortField;
    const direction = sortDirection(sortOrder);
    if (direction) query.orderType = direction;
  }
  return query;
}

function pageData(response) {
  if (response?.code != null && response.code !== 0) {
    throw Object.assign(Error(response.msg || response.message || "列表读取失败"), { code: response.code });
  }
  const data = response?.data ?? response;
  return { total: Number(data?.total) || 0, rows: Array.isArray(data?.rows) ? data.rows : [] };
}

export function createTableLoader({ wait, params, read, apply, busy, failed, paginate }) {
  let revision = 0, activation = 0, disposed = false, pending, dirty = false;
  let foregroundPending = false;
  async function load(background = false) {
    if (disposed) return;
    const ticket = ++revision;
    if (!background) {
      foregroundPending = true;
      busy(true);
    }
    const current = () => !disposed && revision === ticket;
    try {
      await wait();
      if (!current()) return;
      const query = params();
      let page = query.page_index;
      let result = pageData(await read(query, current));
      if (!current()) return;
      if (paginate() && result.rows.length === 0 && page > 1) {
        const lastPage = Math.max(1, Math.ceil(result.total / query.page_size));
        if (lastPage < page) {
          page = lastPage;
          result = pageData(await read({ ...query, page_index: page }, current));
          if (!current()) return;
        }
      }
      // A profile-change read can replace a manual read, but must still apply it as a manual refresh.
      apply(result, {
        background: !foregroundPending,
        first: page !== query.page_index ? (page - 1) * query.page_size : undefined,
      });
    } catch (error) {
      if (current()) failed(error);
    } finally {
      if (current()) {
        foregroundPending = false;
        busy(false);
      }
    }
  }
  function refresh() {
    if (disposed) return;
    const active = activation;
    dirty = true;
    pending ||= Promise.resolve().then(async () => {
      while (active === activation && dirty && !disposed) {
        dirty = false;
        await load(true);
      }
    }).finally(() => {
      if (active !== activation) return;
      pending = null;
      if (dirty && !disposed) return refresh();
    });
    return pending;
  }
  function invalidate() {
    if (disposed) return;
    // Cache-only navigation supersedes reads just as a new request would.
    // Give a new scope its own background lane, even if the old IPC stalls.
    revision++;
    activation++;
    pending = null;
    dirty = false;
    foregroundPending = false;
    busy(false);
  }
  return { load, refresh, invalidate, dispose() { disposed = true; } };
}
