"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { readLocalStore, encodeLocalStore } = require("./local-store");
const uid = () => crypto.randomUUID();
const clone = (v) => structuredClone(v);
const { fromRoxy, toRoxy } = require("./profile-dto");
const { resolveLocalRoute } = require("./local-route-registry");

class LocalService {
  constructor({
    engine,
    root,
    dialog,
    window,
    proxyStore,
    accountStore,
    automation,
    beforeRemove,
    isSynchronizing,
  }) {
    Object.assign(this, {
      engine,
      root,
      dialog,
      window,
      proxyStore,
      accountStore,
      automation,
      beforeRemove,
    });
    this.queue = Promise.resolve();
    this.extensions = new (require("./extensions").Extensions)(this);
    this.robot = new (require("./cookie-robot").CookieRobot)({
      root,
      engine,
      isSynchronizing,
      notify: (job) =>
        this.request("notifications:append", {
          title: "Cookie Robot",
          message: `${this.engine.profiles.get(job.profileId)?.name || job.profileId}: ${job.status}${job.error ? " — " + job.error : ""}`,
        }),
    });
    this.agent = new (require("./agent-service").AgentService)({
      root,
      engine,
      dialog,
      window,
      localRequest: (method, payload) => this.request(method, payload),
    });
    this.file = path.join(root, "rebuild-local.json");
  }
  resolveInputs(input) {
    const p = clone(input);
    const proxy = p.proxyInfoList?.[0] || p;
    const proxyId =
      proxy.moduleId || (proxy.proxyCategory !== "noproxy" && proxy.id);
    if (proxyId && (p.proxyInfoList?.length || p.moduleId)) {
      const record = this.proxyStore?.().get(String(proxyId));
      if (!record) throw Error("所选代理不存在，请重新选择");
      p.proxyInfoList = [{ ...record, moduleId: record.id }];
    }
    const accountIds = p.platformUrlIds || [];
    if (!Array.isArray(accountIds)) throw Error("平台账号 ID 必须是数组");
    if (accountIds.length) {
      const store = this.accountStore?.();
      if (!store) throw Error("账号库尚未就绪");
      // Resolve only explicitly selected IDs in the main process. List DTOs are redacted.
      p.windowPlatformList = [
        ...(p.windowPlatformList || []).filter(
          (row) => !accountIds.includes(row.accountId || row.id),
        ),
        ...accountIds.map((id) => {
          const account = store.get(String(id));
          return {
            accountId: account.id,
            id: account.id,
            platformUrl: account.url,
            platformUserName: account.username,
            platformPassword: account.password,
            platformEfa: account.totpSecret,
          };
        }),
      ];
    }
    return p;
  }
  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.loadOnce().catch((error) => {
      this.data = undefined;
      this.loadPromise = null;
      throw error;
    });
    return this.loadPromise;
  }
  async loadOnce() {
    if (this.data) return;
    let migrated = false;
    try {
      const loaded = await readLocalStore(this.file);
      this.data = loaded.data;
      migrated = loaded.legacy;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      this.data = {
        version: 1,
        groups: [],
        templates: [],
        filters: [],
        settings: {},
        skills: [],
        tasks: [],
      };
    }
    if (this.data.version !== 1) throw Error("Unsupported local store version");
    // The old renderer kept group labels in its own origin's localStorage.
    // Recover groups still referenced by original backend profiles on first load.
    for (const profile of this.engine.status()) {
      if (
        profile.groupId &&
        !this.data.groups.some((group) => group.id === profile.groupId)
      ) {
        this.data.groups.push({
          id: profile.groupId,
          project_id: profile.groupId,
          projectName: profile.group_name || profile.groupId,
        });
        migrated = true;
      }
    }
    if (migrated) await this.save();
  }
  async save() {
    const content = encodeLocalStore(this.data),
      tmp = this.file + "." + uid() + ".tmp";
    await fs.mkdir(this.root, { recursive: true });
    try {
      await fs.writeFile(tmp, content, { mode: 0o600 });
      await fs.rename(tmp, this.file);
    } finally {
      await fs.rm(tmp, { force: true });
    }
  }
  profileIndex() {
    const snapshot = this.engine.status(),
      groups = this.data.groups,
      labels = this.data.labels;
    const cached = this.profileProjection;
    if (
      cached?.snapshot === snapshot &&
      cached.groups === groups &&
      cached.labels === labels
    )
      return cached;
    const index = {
      snapshot,
      groups,
      labels,
      groupById: new Map(groups.map((row) => [row.id, row])),
      labelById: new Map((labels || []).map((row) => [row.id, row])),
      groupCounts: new Map(),
      proxyProfiles: new Map(),
      labelProfiles: new Map(),
      summaries: [],
    };
    for (const profile of snapshot) {
      const labelIds = /^\d+(,\d+)*$/.test(profile.tag || "")
        ? profile.tag.split(",").map(Number)
        : [];
      if (!profile.trashed) {
        index.groupCounts.set(
          profile.groupId || "",
          (index.groupCounts.get(profile.groupId || "") || 0) + 1,
        );
        if (profile.proxyId) {
          if (!index.proxyProfiles.has(profile.proxyId))
            index.proxyProfiles.set(profile.proxyId, []);
          index.proxyProfiles
            .get(profile.proxyId)
            .push({
              id: profile.id,
              windowName: profile.name,
              windowSortNum: profile.number,
            });
        }
        for (const id of labelIds) {
          if (!index.labelProfiles.has(id)) index.labelProfiles.set(id, []);
          index.labelProfiles.get(id).push(profile.id);
        }
      }
      index.summaries.push({
        source: profile,
        windowName: profile.name || "",
        windowRemark: profile.note || "",
        windowSortNum: profile.number,
        projectId: profile.groupId || "",
        openStatus: !!profile.running,
        isOften: !!profile.favorite,
        os: profile.os,
        coreType: profile.engine === "firefox" ? "Firefox" : "Chrome",
        labelIds,
        labelInfos: labelIds
          .map((id) => index.labelById.get(id))
          .filter(Boolean)
          .map((label) => ({ labelName: label.name })),
        windowPlatformList: (
          profile.platform?.accounts ||
          (profile.platform ? [profile.platform] : [])
        ).map((account) => ({
          platformUrl:
            account.url || account.startUrl || profile.platform?.startUrl,
        })),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        openTime: profile.lastOpenedAt,
      });
    }
    this.profileProjection = index;
    return index;
  }
  decorate(profile) {
    const index = this.profileIndex();
    const row = toRoxy(profile);
    const labelInfo = row.labelIds
      .map((id) => index.labelById.get(id))
      .filter(Boolean)
      .map((label) => ({
        labelId: String(label.id),
        labelName: label.name,
        labelColor: label.color,
      }));
    return {
      ...row,
      projectName:
        index.groupById.get(profile.groupId)?.projectName ||
        profile.group_name ||
        "",
      labelInfo,
      labelInfos: labelInfo,
    };
  }
  request(method, payload = {}) {
    if (method.startsWith("cookie-robot:"))
      return this.load().then(() =>
        this.robot.request(method.slice(13), payload),
      );
    if (method.startsWith("agent:"))
      return this.agent.request(method.slice(6), payload);
    // The original engine owns process/proxy concurrency. Do not hold local JSON
    // writes or status reads behind a long browser launch or network probe.
    const route = resolveLocalRoute(method);
    if (route.execution === "parallel")
      return this.load().then(() => this.dispatch(method, payload));
    // Serializing local mutations prevents lost updates; failures never poison the queue.
    const run = this.queue.then(async () => {
      await this.load();
      const previous = clone(this.data);
      try {
        return await this.dispatch(method, payload);
      } catch (error) {
        this.data = previous;
        throw error;
      }
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
  async dispatch(method, payload) {
    const route = resolveLocalRoute(method);
    return route.handle(this, payload, method);
  }
}
module.exports = { LocalService, fromRoxy, toRoxy };
