import {St as ref,D as h,V as onMounted,R as onBeforeUnmount} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as Button} from "./rx-button-DyzuUt-V.js";
import {t as Input} from "./m-input-text-JVbCgVJP.js";
import {t as Alert} from "./rx-alert-A_y5uvgP.js";
const ipc = (method, payload = {}) => globalThis.__localRequest(method, payload);
const btn = (label, action, props = {}) => h(Button, {
  label,
  onClick: action,
  severity: "secondary",
  outlined: !0,
  ...props
});
const shell = (title, children) => h(
  "section",
  {
    class: "flex flex-col h-full min-h-0 overflow-y-auto gap-4 px-6 py-5 tt-primary"
  },
  [h("h2", { class: "text-5 font-600 m-0" }, title), ...children]
);
const table = (head, rows) => h(
  "div",
  {
    class: "overflow-auto border border-solid border-[var(--colors-border-border-subtle)] rounded-2"
  },
  [
    h("table", { class: "w-full text-3.25 text-left border-collapse" }, [
      h(
        "thead",
        { class: "bg-[var(--colors-background-bg-block)]" },
        h(
          "tr",
          head.map((x) => h("th", { class: "px-4 py-3 font-500" }, x))
        )
      ),
      h(
        "tbody",
        rows.map(
          (cells, i) => h(
            "tr",
            {
              key: i,
              class: "border-t border-solid border-[var(--colors-border-border-subtle)]"
            },
            cells.map((cell) => h("td", { class: "px-4 py-3" }, cell))
          )
        )
      )
    ])
  ]
);
const Kernels = {
  setup() {
    const rows = ref([]), custom = ref(""), family = ref("chromium"), versions = ref([]), version = ref(""), busy = ref(!1), error = ref(""), progress = ref("");
    let dispose;
    const run = async (fn) => {
      busy.value = !0, error.value = "";
      try {
        await fn();
      } catch (e) {
        throw error.value = e.message, e;
      } finally {
        busy.value = !1;
      }
    }, load = async () => {
      rows.value = await ipc("kernels:list");
    };
    return onMounted(() => {
      load().catch((e) => error.value = e.message), dispose = globalThis.ops.onEvent((e) => {
        (e.type === "kernel-progress" || e.type === "kernel-status") && (progress.value = e.message || e.phase || e.status || "", ["ready", "installed", "done", "deleted"].includes(e.phase) && load().catch((e2) => error.value = e2.message));
      });
    }), onBeforeUnmount(() => dispose?.()), () => shell("\u5185\u6838\u7BA1\u7406", [
      error.value ? h(Alert, {
        type: "error",
        content: error.value,
        closable: !1,
        role: "alert"
      }) : null,
      h("div", { class: "flex gap-2 items-center" }, [
        btn("\u5237\u65B0", () => run(load), { disabled: busy.value }),
        btn(
          "\u4E0B\u8F7D Chrome Stable",
          () => run(async () => {
            await globalThis.ops.kernelDownload(!1), await load();
          }),
          { disabled: busy.value }
        ),
        btn("\u53D6\u6D88\u4E0B\u8F7D", () => globalThis.ops.kernelCancelDownload()),
        h("span", { role: "status" }, progress.value)
      ]),
      h("div", { class: "flex gap-2 items-center" }, [
        h(Input, {
          modelValue: custom.value,
          "onUpdate:modelValue": (v) => custom.value = v,
          placeholder: "\u672C\u5730 Chrome / Firefox \u53EF\u6267\u884C\u6587\u4EF6\u8DEF\u5F84",
          "aria-label": "\u5185\u6838\u8DEF\u5F84",
          class: "flex-1"
        }),
        btn(
          "\u9009\u62E9\u6587\u4EF6",
          () => run(async () => {
            await globalThis.ops.kernelChooseCustom(), await load();
          })
        ),
        btn(
          "\u4F7F\u7528\u6B64\u5185\u6838",
          () => run(async () => {
            await globalThis.ops.kernelSetCustom(custom.value), await load();
          }),
          { disabled: !custom.value || busy.value }
        )
      ]),
      h("div", { class: "flex gap-2 items-center" }, [
        h(
          "select",
          {
            "aria-label": "\u5185\u6838\u7C7B\u578B",
            value: family.value,
            onChange: (e) => {
              family.value = e.target.value, versions.value = [], version.value = "";
            }
          },
          [
            h("option", { value: "chromium" }, "Chrome"),
            h("option", { value: "firefox" }, "Firefox")
          ]
        ),
        btn(
          "\u83B7\u53D6\u53EF\u4E0B\u8F7D\u7248\u672C",
          () => run(async () => {
            versions.value = await globalThis.ops.kernelListVersions(
              family.value,
              !0
            );
            const list = Array.isArray(versions.value) ? versions.value : versions.value.versions || [];
            versions.value = list, version.value = String(list[0]?.version || list[0] || "");
          })
        ),
        h(
          "select",
          {
            "aria-label": "\u5185\u6838\u7248\u672C",
            value: version.value,
            onChange: (e) => version.value = e.target.value
          },
          versions.value.map(
            (v) => h(
              "option",
              { value: String(v.version || v) },
              String(v.version || v)
            )
          )
        ),
        btn(
          "\u5B89\u88C5\u6240\u9009\u7248\u672C",
          () => run(async () => {
            await globalThis.ops.kernelInstallVersion(
              family.value,
              version.value
            ), await load();
          }),
          { disabled: !version.value || busy.value }
        )
      ]),
      table(
        ["\u7C7B\u578B", "\u7248\u672C", "\u6765\u6E90", "\u64CD\u4F5C"],
        rows.value.map((k) => [
          k.engine === "firefox" ? "Firefox" : "Chrome",
          k.version,
          k.source,
          h("div", { class: "flex gap-2" }, [
            btn(
              "\u68C0\u6D4B",
              () => run(() => globalThis.ops.kernelCheck(k.engine, k.version))
            ),
            btn(
              "\u8BBE\u4E3A\u9ED8\u8BA4",
              () => run(async () => {
                await globalThis.ops.kernelPin(k.engine, k.version), await load();
              }),
              { disabled: k.primary }
            ),
            btn(
              "\u5220\u9664",
              () => run(async () => {
                await globalThis.ops.kernelDelete(k.engine, k.version), await load();
              }),
              { disabled: k.primary }
            )
          ])
        ])
      ),
      rows.value.length ? null : h(
        "p",
        { class: "tt-tertiary" },
        "\u5C1A\u65E0\u53EF\u7528\u5185\u6838\u3002\u8BF7\u4E0B\u8F7D\u5185\u6838\uFF0C\u6216\u9009\u62E9\u672C\u5730\u53EF\u6267\u884C\u6587\u4EF6\u3002"
      )
    ]);
  }
};
const Templates = {
  setup() {
    const rows = ref([]), error = ref(""), load = async () => rows.value = await ipc("templates:list"), run = async (fn) => {
      error.value = "";
      try {
        await fn(), await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    return onMounted(() => run(load)), () => shell("\u7A97\u53E3\u6A21\u677F", [
      error.value ? h(Alert, {
        type: "error",
        content: error.value,
        closable: !1,
        role: "alert"
      }) : null,
      h(
        "p",
        { class: "tt-secondary m-0" },
        "\u5728\u521B\u5EFA\u7A97\u53E3\u7684\u5B8C\u6574\u8868\u5355\u4E2D\u8BBE\u7F6E\u914D\u7F6E\u5E76\u5B58\u4E3A\u6A21\u677F\u3002"
      ),
      h("div", { class: "flex gap-2" }, [
        btn("\u521B\u5EFA\u6A21\u677F", () => globalThis.__router.push("/browser/create")),
        btn("\u5BFC\u5165\u7A97\u53E3\u6587\u4EF6", () => run(() => ipc("transfer:import")))
      ]),
      table(
        ["\u540D\u79F0", "\u64CD\u4F5C"],
        rows.value.map((row) => [
          row.templateName,
          h("div", { class: "flex gap-2" }, [
            btn(
              "\u4F7F\u7528 / \u4FEE\u6539",
              () => globalThis.__router.push({
                path: "/browser/create",
                query: { templateId: String(row.id) }
              })
            ),
            btn(
              "\u5220\u9664",
              () => run(() => ipc("templates:delete", { ids: [row.id] }))
            )
          ])
        ])
      ),
      rows.value.length ? null : h("p", { class: "tt-tertiary" }, "\u6682\u65E0\u6A21\u677F")
    ]);
  }
};
const AgentConfig = {
  setup() {
    const config = ref({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "",
      apiKey: ""
    }), error = ref(""), saved = ref(!1), busy = ref(!1);
    onMounted(async () => {
      try {
        config.value = { ...await ipc("agent:config:get"), apiKey: "" };
      } catch (e) {
        error.value = e.message;
      }
    });
    const save = async () => {
      busy.value = !0, error.value = "";
      try {
        const { hasApiKey: _hasApiKey, ...value } = config.value;
        value.apiKey || delete value.apiKey, await ipc("agent:config:set", value), saved.value = !0;
      } catch (e) {
        error.value = e.message;
      } finally {
        busy.value = !1;
      }
    };
    return () => shell("Agent \u8BBE\u7F6E", [
      error.value ? h(Alert, {
        type: "error",
        content: error.value,
        closable: !1,
        role: "alert"
      }) : null,
      saved.value ? h(Alert, {
        type: "success",
        content: "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58",
        closable: !1,
        role: "status"
      }) : null,
      h("label", {}, [
        "\u6A21\u578B\u670D\u52A1",
        h(
          "select",
          {
            "aria-label": "\u6A21\u578B\u670D\u52A1",
            value: config.value.provider,
            onChange: (e) => {
              config.value.provider = e.target.value, config.value.baseUrl = e.target.value === "ollama" ? "http://127.0.0.1:11434" : "https://api.openai.com/v1";
            }
          },
          [
            h("option", { value: "ollama" }, "Ollama"),
            h("option", { value: "openai" }, "OpenAI \u517C\u5BB9\u63A5\u53E3")
          ]
        )
      ]),
      ...["baseUrl", "model", "apiKey"].map(
        (key, i) => h("label", { class: "flex flex-col gap-2" }, [
          ["\u670D\u52A1\u5730\u5740", "\u6A21\u578B\u540D\u79F0", "API key"][i],
          h(Input, {
            "aria-label": ["\u670D\u52A1\u5730\u5740", "\u6A21\u578B\u540D\u79F0", "API key"][i],
            type: key === "apiKey" ? "password" : "text",
            placeholder: key === "apiKey" && config.value.hasApiKey ? "\u5DF2\u4FDD\u5B58\uFF0C\u7559\u7A7A\u4FDD\u7559\u539F\u503C" : "",
            modelValue: config.value[key],
            "onUpdate:modelValue": (v) => {
              config.value[key] = v, saved.value = !1;
            }
          })
        ])
      ),
      h("div", { class: "flex gap-2" }, [
        btn("\u4FDD\u5B58\u8BBE\u7F6E", save, {
          disabled: busy.value || !config.value.model
        }),
        btn("\u6E05\u9664 API key", async () => {
          await ipc("agent:config:set", { apiKey: "" }), config.value.hasApiKey = !1, config.value.apiKey = "";
        }),
        btn(
          "Skill \u7BA1\u7406",
          () => globalThis.__router.push("/agent-console/skills")
        ),
        btn("MCP \u670D\u52A1", () => globalThis.__router.push("/agent-console/mcp")),
        btn("\u8FD4\u56DE\u5BF9\u8BDD", () => globalThis.__router.push("/agent-console"))
      ])
    ]);
  }
};
const Skills = {
  setup() {
    const rows = ref([]), slug = ref(""), content = ref(""), error = ref(""), load = async () => rows.value = await ipc("agent:skills:list"), run = async (fn) => {
      error.value = "";
      try {
        await fn(), await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    return onMounted(() => run(load)), () => shell("Skill \u7BA1\u7406", [
      error.value ? h(Alert, {
        type: "error",
        content: error.value,
        closable: !1,
        role: "alert"
      }) : null,
      h(Input, {
        "aria-label": "Skill \u540D\u79F0",
        placeholder: "Skill \u540D\u79F0",
        modelValue: slug.value,
        "onUpdate:modelValue": (v) => slug.value = v
      }),
      h("textarea", {
        "aria-label": "Skill \u5185\u5BB9",
        class: "min-h-40 bg-transparent border rounded-2 p-3 tt-primary",
        value: content.value,
        onInput: (e) => content.value = e.target.value
      }),
      h("div", { class: "flex gap-2" }, [
        btn("\u5BFC\u5165 Skill ZIP", () => run(() => ipc("agent:skills:import"))),
        btn(
          "\u4FDD\u5B58 Skill",
          () => run(
            () => ipc("agent:skills:save", {
              slug: slug.value,
              content: content.value,
              enabled: !0
            })
          ),
          { disabled: !slug.value || !content.value }
        ),
        btn("\u8FD4\u56DE\u5BF9\u8BDD", () => globalThis.__router.push("/agent-console"))
      ]),
      table(
        ["\u540D\u79F0", "\u72B6\u6001", "\u64CD\u4F5C"],
        rows.value.map((row) => [
          row.slug,
          row.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u505C\u7528",
          h("div", { class: "flex gap-2" }, [
            btn("\u67E5\u770B", () => {
              slug.value = row.slug, content.value = row.content;
            }),
            btn(
              row.enabled ? "\u505C\u7528" : "\u542F\u7528",
              () => run(
                () => ipc("agent:skills:save", {
                  slug: row.slug,
                  enabled: !row.enabled
                })
              )
            ),
            row.builtin ? null : btn(
              "\u5220\u9664",
              () => run(() => ipc("agent:skills:delete", { slug: row.slug }))
            )
          ])
        ])
      )
    ]);
  }
};
const Transfers = {
  setup() {
    const rows = ref([]), selected = ref([]), error = ref(""), status = ref(""), load = async () => rows.value = await ipc("profiles:list"), run = async (fn) => {
      error.value = "", status.value = "";
      try {
        const result = await fn();
        result && !result.canceled && (status.value = `\u5DF2\u5904\u7406 ${result.count} \u4E2A\u7A97\u53E3`), await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    return onMounted(() => run(load)), () => shell("\u7A97\u53E3\u6587\u4EF6\u4EA4\u6362", [
      error.value ? h(Alert, {
        type: "error",
        content: error.value,
        closable: !1,
        role: "alert"
      }) : null,
      status.value ? h(Alert, {
        type: "success",
        content: status.value,
        closable: !1,
        role: "status"
      }) : null,
      h("div", { class: "flex gap-2" }, [
        btn("\u5BFC\u5165\u7A97\u53E3\u6587\u4EF6", () => run(() => ipc("transfer:import"))),
        btn(
          "\u5BFC\u51FA\u6240\u9009\u7A97\u53E3",
          () => run(() => ipc("transfer:export", { ids: selected.value })),
          { disabled: !selected.value.length }
        )
      ]),
      table(
        ["\u9009\u62E9", "\u7A97\u53E3\u540D\u79F0", "\u9879\u76EE"],
        rows.value.map((row) => [
          h("input", {
            type: "checkbox",
            "aria-label": "\u9009\u62E9 " + row.windowName,
            checked: selected.value.includes(row.id),
            onChange: (e) => {
              selected.value = e.target.checked ? [...selected.value, row.id] : selected.value.filter((id) => id !== row.id);
            }
          }),
          row.windowName,
          row.projectName || "\u672A\u6307\u5B9A\u9879\u76EE"
        ])
      )
    ]);
  }
};
export {AgentConfig as AgentConfig,Kernels as Kernels,Skills as Skills,Templates as Templates,Transfers as Transfers};