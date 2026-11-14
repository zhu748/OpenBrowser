"use strict";
const { normalizeAccount } = require("../automation/account-store");
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
function dto(store, engine, value, secret = false) {
  const row = secret ? store.get(value.id) : value;
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
    window_info: JSON.stringify(
      [...engine.profiles.values()]
        .filter((profile) => !profile.trashed && linked(profile, row.id))
        .map((profile) => profile.number),
    ),
  };
}
async function profileTransaction(engine, profiles) {
  const expected = (profile) => {
    const clean = sanitizeProfile(profile);
    const keys = ["accountId", "url", "username", "password", "totpSecret"];
    if (
      clean.platform.accounts.length !== profile.platform.accounts.length ||
      clean.platform.accounts.some((account, index) =>
        keys.some(
          (key) =>
            (account[key] || "") !==
            (profile.platform.accounts[index][key] || ""),
        ),
      )
    )
      throw Error("窗口账号字段超过原后端限制，本次未修改关联");
    return { platform: clean.platform, startUrl: clean.startUrl };
  };
  for (const row of profiles) row.expected = expected(row.profile);
  const committed = [];
  const rollback = async () => {
    for (let index = committed.length; index > 0; index -= 200) {
      const chunk = committed.slice(Math.max(0, index - 200), index);
      await engine.applyProfileCommands(
        chunk.map((row) => {
          const current = engine.profileForEdit(row.original.id);
          if (
            JSON.stringify(current.profile.platform) !==
              JSON.stringify(row.expected.platform) ||
            current.profile.startUrl !== row.expected.startUrl
          )
            throw Error("关联回滚时窗口账号已被另一个编辑器修改");
          return {
            kind: "modify",
            id: row.original.id,
            baseRev: current.rev,
            profile: {
              ...current.profile,
              startUrl: row.original.startUrl,
              platform: row.original.platform,
            },
          };
        }),
        { delta: true },
      );
    }
  };
  try {
    for (let index = 0; index < profiles.length; index += 200) {
      const chunk = profiles.slice(index, index + 200);
      await engine.applyProfileCommands(
        chunk.map((row) => ({
          kind: "modify",
          id: row.original.id,
          baseRev: row.baseRev,
          profile: row.profile,
        })),
        { delta: true },
      );
      for (const row of chunk)
        committed.push({ original: row.original, expected: row.expected });
    }
  } catch (error) {
    try {
      await rollback();
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "平台账号关联修改失败且回滚不完整，请检查窗口",
      );
    }
    throw error;
  }
  return { rollback };
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
async function requestAccounts(service, method, payload) {
  const store = service.accountStore?.(),
    engine = service.engine;
  if (!store) throw Error("账号库尚未就绪");
  if (method === "list") {
    if (payload.id)
      return {
        rows: [dto(store, engine, { id: String(payload.id) }, true)],
        total: 1,
      };
    let rows = store.list().map((row) => dto(store, engine, row));
    const query = String(payload.queryValue || "").toLowerCase();
    if (query)
      rows = rows.filter((row) => {
        const key = {
          name_remark: null,
          platform: "platformUrl",
          account: "platformUserName",
          remark: "platformRemarks",
        }[payload.queryKey];
        return String(
          key
            ? row[key] || ""
            : [row.platformUrl, row.platformUserName, row.platformRemarks].join(
                " ",
              ),
        )
          .toLowerCase()
          .includes(query);
      });
    if (payload.platformUrl)
      rows = rows.filter((row) => row.platformUrl === payload.platformUrl);
    const size = Math.min(5000, Math.max(1, Number(payload.page_size) || 200)),
      page = Math.max(1, Number(payload.page_index) || 1);
    return {
      rows: rows.slice((page - 1) * size, page * size),
      total: rows.length,
    };
  }
  if (method === "create") {
    const values = payload.values;
    if (!Array.isArray(values) || !values.length || values.length > 500)
      throw Error("一次可添加 1–500 个账号");
    const rows = values.map((value) => input(value));
    await store.import(rows);
    return rows.map((row) => dto(store, engine, row, true));
  }
  if (method === "bind") {
    const id = String(payload.platformId),
      account = store.get(id);
    if (
      !Array.isArray(payload.windowIds) ||
      payload.windowIds.length > 200 ||
      new Set(payload.windowIds).size !== payload.windowIds.length
    )
      throw Error("请选择 0–200 个不同窗口");
    const ids = new Set(payload.windowIds.map(String));
    for (const id of ids)
      if (engine.profileForEdit(id).profile.trashed)
        throw Error("不能绑定回收站窗口");
    await store.mutate(async () => {
      // Serialize with legacy account-store writes. Re-read after acquiring it.
      const current = store.get(account.id),
        changes = [];
      for (const candidate of engine.profiles.values()) {
        if (!ids.has(candidate.id) && !linked(candidate, id)) continue;
        const original = engine.profileForEdit(candidate.id),
          accounts = (original.profile.platform?.accounts || []).filter(
            (row) => row.accountId !== id,
          );
        if (ids.has(candidate.id)) accounts.push(nativeAccount(current));
        if (accounts.length > 20) throw Error("窗口最多可绑定 20 个账号");
        changes.push({
          original: original.profile,
          baseRev: original.rev,
          profile: withAccounts(original.profile, accounts),
        });
      }
      return profileTransaction(engine, changes);
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
module.exports = { requestAccounts, input };
