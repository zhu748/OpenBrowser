import {
  St as ref,
  D as h,
  V as onMounted,
  R as onBeforeUnmount,
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
const table = (head, rows) =>
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
                key: i,
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
      version = ref(""),
      busy = ref(false),
      error = ref(""),
      progress = ref("");
    let dispose;
    const run = async (fn) => {
      busy.value = true;
      error.value = "";
      try {
        await fn();
      } catch (e) {
        error.value = e.message;
        throw e;
      } finally {
        busy.value = false;
      }
    };
    const load = async () => {
      rows.value = await ipc("kernels:list");
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
    onBeforeUnmount(() => dispose?.());
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
        h("div", { class: "flex gap-2 items-center" }, [
          h(
            "select",
            {
              "aria-label": "内核类型",
              value: family.value,
              onChange: (e) => {
                family.value = e.target.value;
                versions.value = [];
                version.value = "";
              },
            },
            [
              h("option", { value: "chromium" }, "Chrome"),
              h("option", { value: "firefox" }, "Firefox"),
            ],
          ),
          btn("获取可下载版本", () =>
            run(async () => {
              versions.value = await globalThis.ops.kernelListVersions(
                family.value,
                true,
              );
              const list = Array.isArray(versions.value)
                ? versions.value
                : versions.value.versions || [];
              versions.value = list;
              version.value = String(list[0]?.version || list[0] || "");
            }),
          ),
          h(
            "select",
            {
              "aria-label": "内核版本",
              value: version.value,
              onChange: (e) => (version.value = e.target.value),
            },
            versions.value.map((v) =>
              h(
                "option",
                { value: String(v.version || v) },
                String(v.version || v),
              ),
            ),
          ),
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
      busy = ref(false);
    onMounted(async () => {
      try {
        config.value = { ...(await ipc("agent:config:get")), apiKey: "" };
      } catch (e) {
        error.value = e.message;
      }
    });
    const save = async () => {
      busy.value = true;
      error.value = "";
      try {
        const { hasApiKey: _hasApiKey, ...value } = config.value;
        if (!value.apiKey) delete value.apiKey;
        await ipc("agent:config:set", value);
        saved.value = true;
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
              value: config.value.provider,
              onChange: (e) => {
                config.value.provider = e.target.value;
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
              placeholder:
                key === "apiKey" && config.value.hasApiKey
                  ? "已保存，留空保留原值"
                  : "",
              modelValue: config.value[key],
              "onUpdate:modelValue": (v) => {
                config.value[key] = v;
                saved.value = false;
              },
            }),
          ]),
        ),
        h("div", { class: "flex gap-2" }, [
          btn("保存设置", save, {
            disabled: busy.value || !config.value.model,
          }),
          btn("清除 API key", async () => {
            await ipc("agent:config:set", { apiKey: "" });
            config.value.hasApiKey = false;
            config.value.apiKey = "";
          }),
          btn("Skill 管理", () =>
            globalThis.__router.push("/agent-console/skills"),
          ),
          btn("MCP 服务", () => globalThis.__router.push("/agent-console/mcp")),
          btn("返回对话", () => globalThis.__router.push("/agent-console")),
        ]),
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
    const rows = ref([]),
      selected = ref([]),
      error = ref(""),
      status = ref("");
    const load = async () => (rows.value = await ipc("profiles:list"));
    const run = async (fn) => {
      error.value = "";
      status.value = "";
      try {
        const result = await fn();
        if (result && !result.canceled)
          status.value = `已处理 ${result.count} 个窗口`;
        await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    onMounted(() => run(load));
    return () =>
      shell("窗口文件交换", [
        error.value
          ? h(Alert, {
              type: "error",
              content: error.value,
              closable: false,
              role: "alert",
            })
          : null,
        status.value
          ? h(Alert, {
              type: "success",
              content: status.value,
              closable: false,
              role: "status",
            })
          : null,
        h("div", { class: "flex gap-2" }, [
          btn("导入窗口文件", () => run(() => ipc("transfer:import"))),
          btn(
            "导出所选窗口",
            () => run(() => ipc("transfer:export", { ids: selected.value })),
            { disabled: !selected.value.length },
          ),
        ]),
        table(
          ["选择", "窗口名称", "项目"],
          rows.value.map((row) => [
            h("input", {
              type: "checkbox",
              "aria-label": "选择 " + row.windowName,
              checked: selected.value.includes(row.id),
              onChange: (e) => {
                selected.value = e.target.checked
                  ? [...selected.value, row.id]
                  : selected.value.filter((id) => id !== row.id);
              },
            }),
            row.windowName,
            row.projectName || "未指定项目",
          ]),
        ),
      ]);
  },
};
