import {
  St as ref,
  D as h,
  V as onMounted,
  R as onBeforeUnmount,
  st as watch,
} from "./runtime-core.esm-bundler-CBj16o9G.js";
import { t as Button } from "./rx-button-DyzuUt-V.js";
import { t as Input } from "./m-input-text-JVbCgVJP.js";
import { t as Alert } from "./rx-alert-A_y5uvgP.js";
const ipc = (method, payload = {}) =>
  globalThis.__localRequest(method, payload);
const btn = (label, action, props = {}) =>
  h(Button, {
    label,
    onClick: action,
    severity: "secondary",
    outlined: true,
    ...props,
  });
const shell = (title, children) =>
  h(
    "section",
    {
      class:
        "flex flex-col h-full min-h-0 overflow-y-auto gap-4 px-6 py-5 tt-primary",
    },
    [h("h2", { class: "text-5 font-600 m-0" }, title), ...children],
  );
const table = (head, rows, keyBy = (_cells, index) => index) =>
  h(
    "div",
    {
      class:
        "overflow-auto border border-solid border-[var(--colors-border-border-subtle)] rounded-2",
    },
    [
      h("table", { class: "w-full text-3.25 text-left border-collapse" }, [
        h(
          "thead",
          { class: "bg-[var(--colors-background-bg-block)]" },
          h(
            "tr",
            head.map((x) => h("th", { class: "px-4 py-3 font-500" }, x)),
          ),
        ),
        h(
          "tbody",
          rows.map((cells, i) =>
            h(
              "tr",
              {
                key: keyBy(cells, i),
                class:
                  "border-t border-solid border-[var(--colors-border-border-subtle)]",
              },
              cells.map((cell) => h("td", { class: "px-4 py-3" }, cell)),
            ),
          ),
        ),
      ]),
    ],
  );
export const Kernels = {
  setup() {
    const rows = ref([]),
      custom = ref(""),
      family = ref("chromium"),
      versions = ref([]),
      historicalVersions = ref([]),
      showHistorical = ref(false),
      version = ref(""),
      busy = ref(false),
      error = ref(""),
      progress = ref("");
    let dispose, versionRequest = 0, disposed = false, pending = 0;
    const run = async (fn) => {
      busy.value = ++pending > 0;
      error.value = "";
      try {
        await fn();
      } catch (e) {
        error.value = e.message;
        throw e;
      } finally {
        busy.value = --pending > 0;
      }
    };
    const load = async () => {
      rows.value = await ipc("kernels:list");
    };
    const readVersion = (row) => String(row.version || row);
    const loadVersions = async () => {
      const request = ++versionRequest, selectedFamily = family.value;
      busy.value = ++pending > 0;
      error.value = "";
      try {
        const response = await globalThis.ops.kernelListVersions(selectedFamily, true);
        if (disposed || request !== versionRequest || family.value !== selectedFamily) return;
        const catalog = Array.isArray(response) ? { versions: response } : response;
        versions.value = (catalog.versions || []).map(readVersion);
        historicalVersions.value = (catalog.historicalVersions || []).map(readVersion);
        showHistorical.value = showHistorical.value && historicalVersions.value.length > 0;
        if (!versions.value.includes(version.value) &&
          !(showHistorical.value && historicalVersions.value.includes(version.value))) {
          version.value = versions.value[0] || "";
        }
      } catch (e) {
        if (!disposed && request === versionRequest && family.value === selectedFamily) error.value = e.message;
      } finally { busy.value = --pending > 0; }
    };
    const toggleHistorical = () => {
      showHistorical.value = !showHistorical.value;
      if (!showHistorical.value && historicalVersions.value.includes(version.value)) {
        version.value = versions.value[0] || "";
      }
    };
    onMounted(() => {
      load().catch((e) => (error.value = e.message));
      dispose = globalThis.ops.onEvent((e) => {
        if (e.type === "kernel-progress" || e.type === "kernel-status") {
          progress.value = e.message || e.phase || e.status || "";
          if (["ready", "installed", "done", "deleted"].includes(e.phase))
            load().catch((e) => (error.value = e.message));
        }
      });
    });
    onBeforeUnmount(() => { disposed = true; versionRequest++; dispose?.(); });
    return () =>
      shell("内核管理", [
        error.value
          ? h(Alert, {
              type: "error",
              content: error.value,
              closable: false,
              role: "alert",
            })
          : null,
        h("div", { class: "flex gap-2 items-center" }, [
          btn("刷新", () => run(load), { disabled: busy.value }),
          btn(
            "下载 Chrome Stable",
            () =>
              run(async () => {
                await globalThis.ops.kernelDownload(false);
                await load();
              }),
            { disabled: busy.value },
          ),
          btn("取消下载", () => globalThis.ops.kernelCancelDownload()),
          h("span", { role: "status" }, progress.value),
        ]),
        h("div", { class: "flex gap-2 items-center" }, [
          h(Input, {
            modelValue: custom.value,
            "onUpdate:modelValue": (v) => (custom.value = v),
            placeholder: "本地 Chrome / Firefox 可执行文件路径",
            "aria-label": "内核路径",
            class: "flex-1",
          }),
          btn("选择文件", () =>
            run(async () => {
              await globalThis.ops.kernelChooseCustom();
              await load();
            }),
          ),
          btn(
            "使用此内核",
            () =>
              run(async () => {
                await globalThis.ops.kernelSetCustom(custom.value);
                await load();
              }),
            { disabled: !custom.value || busy.value },
          ),
        ]),
        h("div", { class: "flex flex-wrap gap-2 items-center" }, [
          h(
            "select",
            {
              "aria-label": "内核类型",
              value: family.value,
              onChange: (e) => {
                versionRequest++;
                family.value = e.target.value;
                versions.value = [];
                historicalVersions.value = [];
                showHistorical.value = false;
                version.value = "";
              },
            },
            [
              h("option", { value: "chromium" }, "Chrome"),
              h("option", { value: "firefox" }, "Firefox"),
            ],
          ),
          btn("获取可下载版本", loadVersions, { disabled: busy.value }),
          h(
            "select",
            {
              "aria-label": "内核版本",
              value: version.value,
              onChange: (e) => (version.value = e.target.value),
            },
            [
              ...versions.value.map((v) => h("option", { value: v }, v)),
              showHistorical.value
                ? h("optgroup", { label: "历史版本" },
                    historicalVersions.value.map((v) => h("option", { value: v }, v)))
                : null,
            ],
          ),
          historicalVersions.value.length
            ? btn(showHistorical.value ? "收起历史版本" : `显示历史版本（${historicalVersions.value.length}）`,
                toggleHistorical, { disabled: busy.value, "aria-expanded": showHistorical.value })
            : null,
          btn(
            "安装所选版本",
            () =>
              run(async () => {
                await globalThis.ops.kernelInstallVersion(
                  family.value,
                  version.value,
                );
                await load();
              }),
            { disabled: !version.value || busy.value },
          ),
        ]),
        table(
          ["类型", "版本", "来源", "操作"],
          rows.value.map((k) => [
            k.engine === "firefox" ? "Firefox" : "Chrome",
            k.version,
            k.source,
            h("div", { class: "flex gap-2" }, [
              btn("检测", () =>
                run(() => globalThis.ops.kernelCheck(k.engine, k.version)),
              ),
              btn(
                "设为默认",
                () =>
                  run(async () => {
                    await globalThis.ops.kernelPin(k.engine, k.version);
                    await load();
                  }),
                { disabled: k.primary },
              ),
              btn(
                "删除",
                () =>
                  run(async () => {
                    await globalThis.ops.kernelDelete(k.engine, k.version);
                    await load();
                  }),
                { disabled: k.primary },
              ),
            ]),
          ]),
        ),
        !rows.value.length
          ? h(
              "p",
              { class: "tt-tertiary" },
              "尚无可用内核。请下载内核，或选择本地可执行文件。",
            )
          : null,
      ]);
  },
};
export const Templates = {
  setup() {
    const rows = ref([]),
      error = ref("");
    const load = async () => (rows.value = await ipc("templates:list"));
    const run = async (fn) => {
      error.value = "";
      try {
        await fn();
        await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    onMounted(() => run(load));
    return () =>
      shell("窗口模板", [
        error.value
          ? h(Alert, {
              type: "error",
              content: error.value,
              closable: false,
              role: "alert",
            })
          : null,
        h(
          "p",
          { class: "tt-secondary m-0" },
          "在创建窗口的完整表单中设置配置并存为模板。",
        ),
        h("div", { class: "flex gap-2" }, [
          btn("创建模板", () => globalThis.__router.push("/browser/create")),
          btn("导入窗口文件", () => run(() => ipc("transfer:import"))),
        ]),
        table(
          ["名称", "操作"],
          rows.value.map((row) => [
            row.templateName,
            h("div", { class: "flex gap-2" }, [
              btn("使用 / 修改", () =>
                globalThis.__router.push({
                  path: "/browser/create",
                  query: { templateId: String(row.id) },
                }),
              ),
              btn("删除", () =>
                run(() => ipc("templates:delete", { ids: [row.id] })),
              ),
            ]),
          ]),
        ),
        !rows.value.length
          ? h("p", { class: "tt-tertiary" }, "暂无模板")
          : null,
      ]);
  },
};
const AgentStorage = {
  setup() {
    const usage = ref(null), pending = ref(0), busy = ref(false);
    const feedback = ref(""), error = ref("");
    const run = async (action) => {
      if (busy.value) return;
      busy.value = true;
      feedback.value = error.value = "";
      try {
        if (action) feedback.value = await action();
        const [files, agent] = await Promise.all([ipc("agent:files:usage"), ipc("agent:info")]);
        usage.value = files;
        pending.value = agent.pendingRunSaves;
      } catch (failure) {
        error.value = failure.message;
      } finally {
        busy.value = false;
      }
    };
    onMounted(() => run());
    return () => h("section", { class: "flex flex-col gap-2", "aria-label": "Agent 存储" }, [
      h("h3", { class: "text-4 font-600 m-0" }, "Agent 存储"),
      usage.value ? h("p", { class: "m-0" },
        `已保存 ${usage.value.count} 个附件，占用 ${(usage.value.bytes / (1024 * 1024)).toFixed(2)} MiB。超过 ${usage.value.retentionDays} 天且无引用的附件可清理。`) : null,
      usage.value?.pendingCleanup ? h("p", { class: "m-0" }, `${usage.value.pendingCleanup} 个附件待清理。`) : null,
      pending.value ? h("p", { class: "m-0" }, `${pending.value} 个任务结果待保存。`) : null,
      h("div", { class: "flex gap-2" }, [
        btn("清理过期附件", () => run(async () => {
          const result = await ipc("agent:files:cleanup");
          return result.busy ? "Agent 正忙，请稍后再清理。" : `已清理 ${result.removed} 个附件。`;
        }), { disabled: busy.value || !usage.value }),
        pending.value ? btn("重试保存任务结果", () => run(async () => {
          const result = await ipc("agent:retryRunSaves");
          return `已保存 ${result.saved} 个任务结果。`;
        }), { disabled: busy.value }) : null,
      ]),
      feedback.value ? h("p", { role: "status", class: "m-0" }, feedback.value) : null,
      error.value ? h(Alert, { type: "error", content: error.value, closable: false, role: "alert" }) : null,
    ]);
  },
};
export const AgentConfig = {
  setup() {
    const config = ref({
        provider: "ollama",
        baseUrl: "http://127.0.0.1:11434",
        model: "",
        apiKey: "",
      }),
      error = ref(""),
      saved = ref(false),
      loaded = ref(false),
      busy = ref(false);
    let revision = 0;
    onMounted(async () => {
      try {
        config.value = { ...(await ipc("agent:config:get")), apiKey: "" };
        loaded.value = true;
      } catch (e) {
        error.value = e.message;
      }
    });
    const save = async () => {
      if (!loaded.value || busy.value) return;
      const savingRevision = revision;
      busy.value = true;
      error.value = "";
      try {
        const { hasApiKey: _hasApiKey, ...value } = config.value;
        if (!value.apiKey) delete value.apiKey;
        const accepted = await ipc("agent:config:set", value);
        saved.value = revision === savingRevision;
        if (saved.value) {
          config.value.hasApiKey = accepted.hasApiKey;
          config.value.apiKey = "";
        }
      } catch (e) {
        error.value = e.message;
      } finally {
        busy.value = false;
      }
    };
    return () =>
      shell("Agent 设置", [
        error.value
          ? h(Alert, {
              type: "error",
              content: error.value,
              closable: false,
              role: "alert",
            })
          : null,
        saved.value
          ? h(Alert, {
              type: "success",
              content: "设置已保存",
              closable: false,
              role: "status",
            })
          : null,
        h("label", {}, [
          "模型服务",
          h(
            "select",
            {
              "aria-label": "模型服务",
              disabled: !loaded.value,
              value: config.value.provider,
              onChange: (e) => {
                revision++; saved.value = false;
                config.value.provider = e.target.value;
                config.value.apiKey = "";
                config.value.hasApiKey = false;
                config.value.baseUrl =
                  e.target.value === "ollama"
                    ? "http://127.0.0.1:11434"
                    : "https://api.openai.com/v1";
              },
            },
            [
              h("option", { value: "ollama" }, "Ollama"),
              h("option", { value: "openai" }, "OpenAI 兼容接口"),
            ],
          ),
        ]),
        ...["baseUrl", "model", "apiKey"].map((key, i) =>
          h("label", { class: "flex flex-col gap-2" }, [
            ["服务地址", "模型名称", "API key"][i],
            h(Input, {
              "aria-label": ["服务地址", "模型名称", "API key"][i],
              type: key === "apiKey" ? "password" : "text",
              disabled: !loaded.value,
              placeholder:
                key === "apiKey" && config.value.hasApiKey
                  ? "已保存，留空保留原值"
                  : "",
              modelValue: config.value[key],
              "onUpdate:modelValue": (v) => {
                revision++;
                config.value[key] = v;
                saved.value = false;
              },
            }),
          ]),
        ),
        h("div", { class: "flex gap-2" }, [
          btn("保存设置", save, {
            disabled: !loaded.value || busy.value || !config.value.model,
          }),
          btn("清除 API key", async () => {
            if (!loaded.value || busy.value) return;
            busy.value = true; error.value = "";
            const clearingRevision = ++revision;
            saved.value = false;
            try {
              await ipc("agent:config:set", { apiKey: "" });
              if (revision === clearingRevision) {
                config.value.hasApiKey = false;
                config.value.apiKey = "";
              }
            } catch (e) { error.value = e.message; }
            finally { busy.value = false; }
          }, { disabled: !loaded.value || busy.value }),
          btn("Skill 管理", () =>
            globalThis.__router.push("/agent-console/skills"),
          ),
          btn("MCP 服务", () => globalThis.__router.push("/agent-console/mcp")),
          btn("消息平台", () => globalThis.__router.push("/agent-console/roxyclaw/telegram")),
          btn("返回对话", () => globalThis.__router.push("/agent-console")),
        ]),
        h(AgentStorage),
      ]);
  },
};
const integrationLabels = {
  telegram: "Telegram",
  lark: "飞书 / Lark",
  slack: "Slack",
  discord: "Discord",
};

export const AgentIntegrationSettings = {
  props: { provider: { type: String, required: true } },
  setup(props) {
    const form = ref({}), hasCredential = ref(false), loaded = ref(false),
      busy = ref(false), error = ref(""), notice = ref(""), telegram = ref({ status: "stopped" });
    let revision = 0, statusRevision = 0;
    function accept(result) {
      form.value = { appId: result.appId || "", environment: result.environment || "feishu", allowedChatIds: result.allowedChatIds || "" };
      hasCredential.value = result.hasCredential;
    }
    watch(() => props.provider, async provider => {
      const generation = ++revision;
      busy.value = loaded.value = false;
      error.value = notice.value = "";
      form.value = {};
      try {
        const values = await ipc("agent:integrations:get", { provider });
        if (generation === revision) {
          accept(values);
          loaded.value = true;
          if (provider === "telegram") await readStatus();
        }
      } catch (e) {
        if (generation === revision) error.value = e.message;
      }
    }, { immediate: true });
    const statusTimer = setInterval(() => {
      if (props.provider === "telegram" && !busy.value) void readStatus();
    }, 1200);
    onBeforeUnmount(() => { revision++; clearInterval(statusTimer); });
    async function readStatus() {
      const generation = revision;
      const update = ++statusRevision;
      try {
        const result = await ipc("agent:telegram:status");
        if (generation === revision && update === statusRevision) telegram.value = result;
      } catch (e) {
        if (generation === revision && update === statusRevision) error.value = e.message;
      }
    }

    async function send(action, clearCredential = false) {
      if (busy.value || !loaded.value) return;
      const generation = revision;
      busy.value = true;
      error.value = notice.value = "";
      try {
        const input = { provider: props.provider, values: { ...form.value }, clearCredential };
        if (clearCredential) delete input.values[props.provider === "lark" ? "appSecret" : "botToken"];
        const result = await ipc(action === "test" ? "agent:integrations:test" : "agent:integrations:set", input);
        if (generation !== revision) return;
        if (action === "test") notice.value = "凭证验证通过";
        else {
          accept(result);
          notice.value = clearCredential ? "凭证已清除" : "配置已保存";
        }
      } catch (e) {
        if (generation === revision) error.value = e.message;
      } finally {
        if (generation === revision) busy.value = false;
      }
    }
    async function controlTelegram(start) {
      if (busy.value || !loaded.value) return;
      const generation = revision;
      statusRevision++;
      busy.value = true;
      error.value = notice.value = "";
      try {
        const status = await ipc(start ? "agent:telegram:start" : "agent:telegram:stop");
        if (generation === revision) telegram.value = status;
      } catch (e) {
        if (generation === revision) error.value = e.message;
      } finally {
        if (generation === revision) busy.value = false;
      }
    }

    const telegramActive = () => props.provider === "telegram" && telegram.value.status !== "stopped";
    const input = (key, label, secret = false) => h("label", { class: "flex flex-col gap-2" }, [
      label,
      h(Input, {
        "aria-label": label,
        type: secret ? "password" : "text",
        disabled: !loaded.value || busy.value || telegramActive(),
        placeholder: secret && hasCredential.value ? "已保存，留空保留原值" : "",
        modelValue: form.value[key] || "",
        "onUpdate:modelValue": value => { form.value[key] = value; notice.value = ""; },
      }),
    ]);
    return () => shell(integrationLabels[props.provider], [
      h("nav", { class: "flex flex-wrap gap-2", "aria-label": "消息平台" }, [
        ...Object.entries(integrationLabels).map(([provider, label]) =>
          btn(label, () => globalThis.__router.push("/agent-console/roxyclaw/" + provider), {
            "aria-current": props.provider === provider ? "page" : undefined,
          })),
        btn("模型设置", () => globalThis.__router.push("/agent-console/settings")),
      ]),
      h("p", { class: "m-0" }, props.provider === "telegram"
        ? "保存凭证和允许的聊天 ID 后即可启动 Bot 文本对话。多个 ID 可用逗号分隔。"
        : "可保存并测试平台凭证，消息收发尚未开放。"),
      ...(props.provider === "lark" ? [
        h("label", { class: "flex flex-col gap-2" }, [
          "环境",
          h("select", {
            "aria-label": "环境", value: form.value.environment, disabled: !loaded.value || busy.value,
            onChange: event => { form.value.environment = event.target.value; notice.value = ""; },
          }, [h("option", { value: "feishu" }, "飞书"), h("option", { value: "lark" }, "Lark")]),
        ]),
        input("appId", "App ID"),
        input("appSecret", "App Secret", true),
      ] : [input("botToken", "Bot Token", true)]),
      ...(props.provider === "telegram" ? [
        input("allowedChatIds", "允许的聊天 ID"),
        h("p", { class: "m-0", role: "status" }, "Telegram · " + ({
          stopped: "已停止", starting: "正在启动", running: "运行中", stopping: "正在停止", error: "连接失败",
        })[telegram.value.status] + (telegram.value.error ? " · " + telegram.value.error : "")),
      ] : []),
      h("div", { class: "flex flex-wrap gap-2" }, [
        btn("保存配置", () => send("save"), { disabled: !loaded.value || busy.value || telegramActive() }),
        btn("测试连接", () => send("test"), { disabled: !loaded.value || busy.value }),
        btn("清除凭证", () => send("save", true), { disabled: !loaded.value || busy.value || !hasCredential.value || telegramActive() }),
        ...(props.provider === "telegram" ? [telegramActive()
          ? btn("停止 Telegram", () => controlTelegram(false), { disabled: busy.value })
          : btn("启动 Telegram", () => controlTelegram(true), { disabled: busy.value || !loaded.value || !hasCredential.value })] : []),
      ]),
      error.value ? h(Alert, { type: "error", content: error.value, closable: false, role: "alert" }) : null,
      notice.value ? h(Alert, { type: "success", content: notice.value, closable: false, role: "status" }) : null,
    ]);
  },
};
export const Skills = {
  setup() {
    const rows = ref([]),
      slug = ref(""),
      content = ref(""),
      error = ref("");
    const load = async () => (rows.value = await ipc("agent:skills:list"));
    const run = async (fn) => {
      error.value = "";
      try {
        await fn();
        await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    onMounted(() => run(load));
    return () =>
      shell("Skill 管理", [
        error.value
          ? h(Alert, {
              type: "error",
              content: error.value,
              closable: false,
              role: "alert",
            })
          : null,
        h(Input, {
          "aria-label": "Skill 名称",
          placeholder: "Skill 名称",
          modelValue: slug.value,
          "onUpdate:modelValue": (v) => (slug.value = v),
        }),
        h("textarea", {
          "aria-label": "Skill 内容",
          class: "min-h-40 bg-transparent border rounded-2 p-3 tt-primary",
          value: content.value,
          onInput: (e) => (content.value = e.target.value),
        }),
        h("div", { class: "flex gap-2" }, [
          btn("导入 Skill ZIP", () => run(() => ipc("agent:skills:import"))),
          btn(
            "保存 Skill",
            () =>
              run(() =>
                ipc("agent:skills:save", {
                  slug: slug.value,
                  content: content.value,
                  enabled: true,
                }),
              ),
            { disabled: !slug.value || !content.value },
          ),
          btn("返回对话", () => globalThis.__router.push("/agent-console")),
        ]),
        table(
          ["名称", "状态", "操作"],
          rows.value.map((row) => [
            row.slug,
            row.enabled ? "已启用" : "已停用",
            h("div", { class: "flex gap-2" }, [
              btn("查看", () => {
                slug.value = row.slug;
                content.value = row.content;
              }),
              btn(row.enabled ? "停用" : "启用", () =>
                run(() =>
                  ipc("agent:skills:save", {
                    slug: row.slug,
                    enabled: !row.enabled,
                  }),
                ),
              ),
              !row.builtin
                ? btn("删除", () =>
                    run(() => ipc("agent:skills:delete", { slug: row.slug })),
                  )
                : null,
            ]),
          ]),
        ),
      ]);
  },
};
export const Transfers = {
  setup() {
    const limit = 200;
    const rows = ref(null);
    const selected = ref(new Set());
    const loading = ref(false);
    const listFailed = ref(false);
    const pending = ref("");
    const receipt = ref(null);
    const actionError = ref("");
    let activeIds = new Set(), listRequest = 0, disposed = false, unsubscribe, importInvalidated = false;
    const tr = (key, values) => globalThis.$t(key, values);

    async function refresh() {
      if (disposed) return;
      const request = ++listRequest;
      loading.value = true;
      try {
        const next = await ipc("profiles:list");
        if (disposed || request !== listRequest) return;
        if (!Array.isArray(next)) throw Error("Invalid profile list");
        const ids = new Set();
        for (const row of next) {
          if (typeof row?.id !== "string" || !row.id || ids.has(row.id)) throw Error("Invalid profile list");
          ids.add(row.id);
        }
        // This route returns the complete active roster, not one filtered page.
        // Only a current, successful read can revoke an invisible selection.
        activeIds = ids;
        selected.value = new Set([...selected.value].filter(id => ids.has(id)));
        rows.value = next;
        listFailed.value = false;
      } catch (_) {
        if (!disposed && request === listRequest) listFailed.value = true;
      } finally {
        if (!disposed && request === listRequest) loading.value = false;
      }
    }

    function onProfileChange(event) {
      if (event?.type !== "profiles" && !(event?.type === "status" && event.action === "profiles-update")) return;
      // Import emits the same profile notification as another client. Fold any
      // notifications received during its chooser/commit into one post-receipt
      // read, even if a different client's update arrived and this import cancels.
      if (pending.value === "import") importInvalidated = true;
      else return refresh();
    }

    function canExport() {
      return !pending.value && !loading.value && !listFailed.value
        && selected.value.size > 0 && selected.value.size <= limit;
    }
    const canRefresh = () => !pending.value && !loading.value;

    async function run(kind) {
      if (disposed || pending.value || (kind === "export" && !canExport())) return;
      const ids = kind === "export" ? [...selected.value] : undefined;
      pending.value = kind;
      receipt.value = null;
      actionError.value = "";
      let refreshAfter = false;
      try {
        const result = kind === "import"
          ? await ipc("transfer:import")
          : await ipc("transfer:export", { ids });
        if (disposed || result?.canceled === true) return;
        const count = result?.count;
        if (!Number.isSafeInteger(count) || count < 0 || count > limit || (ids && count !== ids.length))
          throw Error("Invalid transfer receipt");
        receipt.value = { kind, count };
        refreshAfter = kind === "import" && count > 0;
      } catch (error) {
        if (disposed) return;
        actionError.value = kind === "import"
          ? "未能确认导入，请检查文件后重试。"
          : ["PROFILE_INACTIVE", "PROFILE_NOT_FOUND", "TRANSFER_SELECTION_CHANGED"].includes(error?.code)
            ? "所选窗口已变更，请刷新列表后重试。"
            : "未能确认导出，请检查目标位置后重试。";
      } finally {
        if (!disposed) {
          pending.value = "";
          if (refreshAfter || importInvalidated) {
            importInvalidated = false;
            await refresh();
          }
        }
      }
    }

    onMounted(() => {
      unsubscribe = globalThis.electronAPI.on("local:profiles-change", onProfileChange);
      return refresh();
    });
    onBeforeUnmount(() => {
      disposed = true;
      listRequest++;
      unsubscribe?.();
    });

    return () => {
      const roster = rows.value;
      const count = selected.value.size;
      return shell(tr("窗口文件交换"), [
        actionError.value ? h(Alert, { type: "error", content: tr(actionError.value), closable: false, role: "alert" }) : null,
        receipt.value ? h(Alert, {
          type: "success",
          content: tr(receipt.value.kind === "import" ? "已导入 {count} 个窗口。" : "已导出 {count} 个窗口。", receipt.value),
          closable: false,
          role: "status",
        }) : null,
        listFailed.value ? h(Alert, {
          type: "error",
          content: tr(roster === null ? "未能加载窗口列表，请重试。" : "未能刷新窗口列表，仍显示上次加载的结果。"),
          closable: false,
          role: "alert",
        }) : null,
        h("div", { class: "flex flex-wrap gap-2" }, [
          btn(tr("导入窗口文件"), () => run("import"), { disabled: Boolean(pending.value) }),
          btn(tr("导出所选窗口"), () => run("export"), { disabled: !canExport() }),
          btn(tr(listFailed.value ? "重试" : "刷新窗口列表"), () => {
            if (canRefresh()) return refresh();
          }, { disabled: !canRefresh() }),
        ]),
        h("p", { role: "status", class: "m-0" }, tr("已选择 {count} / {limit} 个窗口", { count, limit })),
        count > limit ? h("p", { role: "alert", class: "m-0" }, tr("一次最多导出 {limit} 个窗口，请取消部分选择。", { limit })) : null,
        pending.value ? h("p", { role: "status", class: "m-0" }, tr("正在等待文件操作完成…")) : null,
        loading.value ? h("p", { role: "status", class: "m-0" }, tr("加载中")) : null,
        !loading.value && !listFailed.value && roster?.length === 0
          ? h("p", { role: "status", class: "m-0" }, tr("暂无窗口"))
          : null,
        roster?.length ? table(
          [tr("选择"), tr("窗口名称"), tr("项目")],
          roster.map(row => [
            h("input", {
              type: "checkbox",
              "aria-label": tr("选择窗口：{name}", { name: row.windowName }),
              checked: selected.value.has(row.id),
              disabled: Boolean(pending.value),
              onChange: event => {
                if (pending.value || !activeIds.has(row.id)) return;
                if (event.target.checked) selected.value.add(row.id);
                else selected.value.delete(row.id);
              },
            }),
            row.windowName,
            row.projectName || tr("未指定项目"),
          ]),
          (_cells, index) => roster[index].id,
        ) : null,
      ]);
    };
  },
};
