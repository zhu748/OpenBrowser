"use strict";
const path = require("node:path");
const { writeRawAtomically } = require("../engine/state-storage");
const { readLocalStore, encodeLocalStore } = require("./local-store");
const clone = (v) => structuredClone(v);
const { fromRoxy, toRoxy } = require("./profile-dto");
const { buildProfileIndex, decorateProfile } = require("./profile-index");
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
      const selected = new Set(accountIds);
      p.windowPlatformList = [
        ...(p.windowPlatformList || []).filter(
          (row) => !selected.has(row.accountId || row.id),
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
    if (Object.hasOwn(this.data, "pendingProfileRelations")) {
      await require("./profile-relations").restoreProfileRelations(this.engine, this.data.pendingProfileRelations);
      delete this.data.pendingProfileRelations;
      migrated = true;
    }
    // The old renderer kept group labels in its own origin's localStorage.
    // Recover groups still referenced by original backend profiles on first load.
    const knownGroups = new Set(this.data.groups.map(group => group.id));
    for (const profile of this.engine.profiles.values()) {
      if (
        profile.groupId &&
        !knownGroups.has(profile.groupId)
      ) {
        this.data.groups.push({
          id: profile.groupId,
          project_id: profile.groupId,
          projectName: profile.group_name || profile.groupId,
        });
        knownGroups.add(profile.groupId);
        migrated = true;
      }
    }
    if (migrated) await this.save();
  }
  async save() {
    await writeRawAtomically(this.file, encodeLocalStore(this.data));
  }
  profileIndex() {
    const snapshot = this.engine.status(),
      profiles = this.engine.profiles,
      version = profiles?.version,
      groups = this.data.groups,
      labels = this.data.labels;
    const cached = this.profileProjection;
    if (
      cached && cached.groups === groups && cached.labels === labels &&
      (cached.snapshot === snapshot || (version !== undefined && cached.profiles === profiles && cached.version === version))
    ) {
      cached.snapshot = snapshot;
      return cached;
    }
    this.profileProjection = buildProfileIndex({ snapshot, profiles, version, groups, labels });
    return this.profileProjection;
  }
  decorate(profile, index = this.profileIndex()) {
    return decorateProfile(profile, index);
  }
  request(method, payload = {}) {
    // The original engine owns process/proxy concurrency. Do not hold local JSON
    // writes or status reads behind a long browser launch or network probe.
    const route = resolveLocalRoute(method);
    const invoke = () => route.handle(this, payload, method);
    if (route.execution === "parallel")
      return route.requiresLocalData ? this.load().then(invoke) : Promise.resolve().then(invoke);
    return this.enqueueLocal(invoke, { rollback: route.execution !== "read" });
  }
  enqueueLocal(invoke, { rollback = true } = {}) {
    // Serializing local mutations prevents lost updates; failures never poison the queue.
    const run = this.queue.then(async () => {
      await this.load();
      // Ordered reads observe completed writes without allocating a rollback
      // copy of unrelated templates, filters and notifications.
      if (!rollback) return invoke();
      const previous = clone(this.data);
      try {
        return await invoke();
      } catch (error) {
        if (error.code === "PROFILE_RELATIONS_RECOVERY_PENDING") {
          this.data = undefined;
          this.loadPromise = null;
        } else this.data = previous;
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
