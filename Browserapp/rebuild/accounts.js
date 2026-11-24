"use strict";
const { isDeepStrictEqual } = require("node:util");
const { pageBounds } = require("./page-bounds");
const { normalizeAccount } = require("../automation/account-store");
const { assertProfileId } = require("../automation/isolation");
const { sanitizeProfile } = require("../engine/profile-sanitizer");
const fields = {
  platformUrl: "url",
  platformUserName: "username",
  platformPassword: "password",
  platformEfa: "totpSecret",
  platformRemarks: "remark",
  platformName: "platform",
};
function input(value, base = {}) {
  const row = { ...base };
  for (const [source, target] of Object.entries(fields))
    if (value[source] !== undefined) row[target] = value[source];
  return normalizeAccount(row);
}
const nativeAccount = (row) => ({
  accountId: row.id,
  url: row.url,
  username: row.username,
  password: row.password,
  totpSecret: row.totpSecret,
});
function linked(profile, id) {
  return profile.platform?.accounts?.some(
    (account) => account.accountId === id,
  );
}
function accountBindings(engine, ids) {
  const bindings = new Map(ids.map(id => [id, []]));
  if (!bindings.size) return bindings;
  for (const profile of engine.profiles.values()) {
    if (profile.trashed) continue;
    for (const { accountId } of profile.platform?.accounts || []) {
      const profiles = bindings.get(accountId);
      // All links for this profile are visited together, including legacy duplicates.
      if (profiles && profiles.at(-1)?.id !== profile.id) profiles.push({ id: profile.id, number: profile.number });
    }
  }
  return bindings;
}
function dto(row, profiles = []) {
  return {
    ...row,
    platformUrl: row.url,
    platformUserName: row.username,
    platformPassword: row.password,
    platformEfa: row.totpSecret,
    platformRemarks: row.remark,
    platformName: row.platform,
    platformIcon: "",
    platformIconDark: "",
    createTime: row.createdAt,
    window_info: JSON.stringify(profiles.map(profile => profile.number)),
    boundProfileIds: profiles.map(profile => profile.id),
  };
}
function expectedAccountFields(profile) {
  const clean = sanitizeProfile(profile);
  const keys = ["accountId", "url", "username", "password", "totpSecret"];
  if (clean.platform.accounts.length !== profile.platform.accounts.length ||
      clean.platform.accounts.some((account, index) =>
        keys.some(key => (account[key] || "") !== (profile.platform.accounts[index][key] || ""))))
    throw Error("窗口账号字段超过原后端限制，本次未修改关联");
  return { platform: clean.platform, startUrl: clean.startUrl };
}
const sameAccountFields = (a, b) => a.startUrl === b.startUrl && isDeepStrictEqual(a.platform, b.platform);

function accountProfileUnavailable(cause) {
  return Object.assign(Error("无法确认窗口账号关联，已保留原数据，请修复存储后重试", { cause }), {
    code: "ACCOUNT_PROFILE_TARGET_UNAVAILABLE",
  });
}

function accountProfileExists(engine, id) {
  try {
    const loaded = engine.profiles.has(id);
    const confirmed = engine.usingSqlite === true
      ? engine.sqliteStore?.hasProfile?.(id) === loaded
      : engine.usingSqlite === false && !engine.sqliteStore && typeof engine.storageRecovery === "boolean";
    // An omitted row may still exist in SQLite, or may be missing only from
    // the backup selected for this boot. Neither case proves a deletion.
    if (confirmed && (loaded || engine.storageRecovery !== true)) return loaded;
  } catch (cause) {
    throw accountProfileUnavailable(cause);
  }
  throw accountProfileUnavailable();
}

async function restoreAccountProfiles(engine, journal) {
  if (!Array.isArray(journal)) throw Error("账号窗口关联日志格式无效");
  const restore = [], conflicts = [], seen = new Set();
  for (const entry of journal) {
    const { before, after } = entry || {};
    const id = assertProfileId(entry?.id);
    if (!before?.platform || !after?.platform || seen.has(id)) throw Error("账号窗口关联日志格式无效");
    seen.add(id);
    if (!accountProfileExists(engine, id)) continue;
    const current = engine.profileForEdit(id);
    if (current?.profile?.id !== id || !Number.isSafeInteger(current.rev) || current.rev <= 0)
      throw accountProfileUnavailable();
    if (sameAccountFields(current.profile, before)) continue;
    if (!sameAccountFields(current.profile, after)) {
      conflicts.push(id);
      continue;
    }
    restore.push({ ...current.profile, startUrl: before.startUrl, platform: before.platform,
      credentialsAction: "replace", rev: current.rev });
  }
  if (restore.length) await engine.commitProfiles(restore, { checkRevisions: true });
  return conflicts;
}

function profileTransaction(engine, profiles) {
  const changes = profiles.map(row => ({ ...row, expected: expectedAccountFields(row.profile) }))
    .filter(row => !sameAccountFields(row.original, row.expected));
  if (!changes.length) return;
  const journal = changes.map(({ original, expected }) => ({
    id: original.id,
    before: { startUrl: original.startUrl, platform: original.platform },
    after: expected,
  }));
  return {
    journal,
    apply: () => {
      // The journal write yields to other editors. Check every target is
      // still existing, then stage its revision in the same synchronous turn.
      // Ordinary profile sync also accepts new rows; this transaction does not.
      for (const { original: { id } } of changes) {
        if (!accountProfileExists(engine, id))
          throw Object.assign(Error(`Profile not found: ${id}`), { code: "PROFILE_NOT_FOUND" });
      }
      return engine.commitProfiles(changes.map(row => ({ ...row.profile, credentialsAction: "replace", rev: row.baseRev })),
        { checkRevisions: true });
    },
    rollback: () => restoreAccountProfiles(engine, journal),
  };
}
function platform(profile, accounts) {
  const first = accounts[0];
  return {
    ...profile.platform,
    accounts,
    startUrl: first?.url || "",
    username: first?.username || "",
    password: first?.password || "",
    totpSecret: first?.totpSecret || "",
  };
}
function withAccounts(profile, accounts) {
  const next = platform(profile, accounts);
  return { ...profile, startUrl: next.startUrl, platform: next };
}
function listAccounts(engine, store, payload) {
  if (payload.id) {
    const account = store.get(String(payload.id));
    const bindings = accountBindings(engine, [account.id]);
    return { rows: [dto(account, bindings.get(account.id))], total: 1 };
  }
  const bounds = pageBounds(payload.page_index ?? 1, payload.page_size ?? 200);
  const { rows, total } = store.page({ ...bounds, platformUrl: payload.platformUrl,
    queryKey: payload.queryKey, queryValue: payload.queryValue });
  const bindings = accountBindings(engine, rows.map(row => row.id));
  return { rows: rows.map(row => dto(row, bindings.get(row.id))), total };
}
async function requestAccounts(service, method, payload) {
  const store = service.accountStore?.(),
    engine = service.engine;
  if (!store) throw Error("账号库尚未就绪");
  if (method === "import-preview") {
    const selection = await require("./account-workbook").selectAccounts(service, payload);
    if (!selection.canceled) selection.values.forEach(value => input(value));
    return selection;
  }
  if (method === "export-template") return require("./account-workbook").exportAccounts(service, [], { template: true });
  if (method === "export") {
    if (!Array.isArray(payload.ids) || !payload.ids.length || payload.ids.length > 500 ||
       new Set(payload.ids.map(String)).size !== payload.ids.length) throw Error("请选择 1–500 个不同账号");
    const includeCredentials = payload.includeCredentials === true;
    const records = await store.runExclusive(() => {
      const ids = payload.ids.map(String);
      const bindings = payload.includeBindings ? accountBindings(engine, ids) : new Map();
      return ids.map(id => {
        const { password, totpSecret, ...account } = store.get(id);
        if (bindings.has(id)) account.boundWindows = bindings.get(id).map(profile => profile.number).join(", ");
        return includeCredentials ? { ...account, password, totpSecret } : account;
      });
    });
    return require("./account-workbook").exportAccounts(service, records, {
      format: payload.format, includeCredentials, includeBindings: Boolean(payload.includeBindings),
    });
  }
  if (method === "list") return store.runExclusive(() => listAccounts(engine, store, payload));
  if (method === "create") {
    const values = payload.values;
    if (!Array.isArray(values) || !values.length || values.length > 500)
      throw Error("一次可添加 1–500 个账号");
    const rows = values.map((value) => input(value));
    await store.import(rows);
    return rows.map(row => dto(store.get(row.id)));
  }
  if (method === "bind") {
    const id = String(payload.platformId);
    if (!Array.isArray(payload.windowIds) || payload.windowIds.length > engine.profiles.size)
      throw Error("窗口选择无效");
    const ids = new Set(payload.windowIds.map(String));
    if (ids.size !== payload.windowIds.length) throw Error("请选择不同的窗口");
    await store.runExclusive(async () => {
      const current = store.get(id);
      for (const id of ids) {
        if (engine.profileForEdit(id).profile.trashed) throw Error("不能绑定回收站窗口");
      }
      const changes = [];
      for (const candidate of engine.profiles.values()) {
        const selected = ids.has(candidate.id);
        if (candidate.trashed || selected === Boolean(linked(candidate, id))) continue;
        const original = engine.profileForEdit(candidate.id);
        const accounts = (original.profile.platform?.accounts || []).filter(row => row.accountId !== id);
        if (selected) accounts.push(nativeAccount(current));
        if (accounts.length > 20) throw Error("窗口最多可绑定 20 个账号");
        changes.push({ original: original.profile, baseRev: original.rev, profile: withAccounts(original.profile, accounts) });
      }
      await profileTransaction(engine, changes)?.apply();
    });
    return { bound: [...ids] };
  }
  if (method === "update" || method === "delete") {
    const values =
      method === "update"
        ? payload.platformList
        : payload.ids?.map((id) => ({ id }));
    if (
      !Array.isArray(values) ||
      !values.length ||
      values.length > 500 ||
      new Set(values.map((row) => String(row.id))).size !== values.length
    )
      throw Error("请选择 1–500 个不同账号");
    await store.mutate(async (next) => {
      const changed = new Map();
      // Validate all account fields before applying any profile or file writes.
      for (const value of values) {
        const id = String(value.id),
          base = next.get(id);
        if (!base) throw Error("账号不存在");
        const row = method === "delete" ? null : input(value, base);
        changed.set(id, row);
        if (row) next.set(id, row);
        else next.delete(id);
      }
      const changes = [];
      for (const candidate of engine.profiles.values()) {
        if (
          !candidate.platform?.accounts?.some((row) =>
            changed.has(row.accountId),
          )
        )
          continue;
        const original = engine.profileForEdit(candidate.id),
          accounts = original.profile.platform.accounts.flatMap((row) =>
            !changed.has(row.accountId)
              ? [row]
              : changed.get(row.accountId)
                ? [nativeAccount(changed.get(row.accountId))]
                : [],
          );
        changes.push({
          original: original.profile,
          baseRev: original.rev,
          profile: withAccounts(original.profile, accounts),
        });
      }
      return profileTransaction(engine, changes);
    });
    return { changed: values.map((row) => String(row.id)) };
  }
  throw Error("未知平台账号操作");
}
module.exports = { requestAccounts, input, restoreAccountProfiles };
