const profileTables = new Set(["browser-list", "browser-recycle-list"]);

export function isProfileTable(key) { return profileTables.has(key); }

let profileCacheVersion = 0;
export function invalidateProfileTableCache() { profileCacheVersion += 1; }
export function listCacheVersion(key) { return isProfileTable(key) ? profileCacheVersion : undefined; }

function pageData(response) {
  if (response?.code != null && response.code !== 0) {
    throw Object.assign(Error(response.msg || response.message || "列表读取失败"), { code: response.code });
  }
  const data = response?.data ?? response;
  return { total: Number(data?.total) || 0, rows: Array.isArray(data?.rows) ? data.rows : [] };
}

export function createTableLoader({ wait, params, read, apply, busy, failed, paginate }) {
  let revision = 0, disposed = false, pending, dirty = false;
  async function load(background = false) {
    if (disposed) return;
    const ticket = ++revision;
    if (!background) busy(true);
    const current = () => !disposed && revision === ticket;
    try {
      await wait();
      if (!current()) return;
      const query = params();
      let page = query.page_index;
      let result = pageData(await read(query));
      if (!current()) return;
      if (paginate() && result.rows.length === 0 && page > 1) {
        const lastPage = Math.max(1, Math.ceil(result.total / query.page_size));
        if (lastPage < page) {
          page = lastPage;
          result = pageData(await read({ ...query, page_index: page }));
          if (!current()) return;
        }
      }
      apply(result, { background, first: page !== query.page_index ? (page - 1) * query.page_size : undefined });
    } catch (error) {
      if (current()) failed(error);
    } finally {
      if (current()) busy(false);
    }
  }
  function refresh() {
    if (disposed) return;
    dirty = true;
    pending ||= Promise.resolve().then(async () => {
      while (dirty && !disposed) {
        dirty = false;
        await load(true);
      }
    }).finally(() => {
      pending = null;
      if (dirty && !disposed) return refresh();
    });
    return pending;
  }
  return { load, refresh, dispose() { disposed = true; } };
}
