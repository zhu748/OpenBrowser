/* global $t */
import {
  D as h,
  St as ref,
  V as onMounted,
  R as onBeforeUnmount,
} from "./runtime-core.esm-bundler-CBj16o9G.js";
import { Z as Icon } from "./basecomponent-ClhuVxJN.js";
import { createUsageCounter } from "./workbench-usage.js";

const ipc = (method, payload = {}) =>
  globalThis.__localRequest(method, payload);

const formatCompactCount = (value) => (value > 999 ? "999+" : String(value));

export const SidebarFooter = {
  props: { collapsed: Boolean },
  __scopeId: "data-v-e0fdeed1",
  setup(props) {
    const count = ref(0);
    const running = ref(0);
    let dispose;

    const totalUsage = createUsageCounter({
      read: () => ipc("profiles:count"),
      update: (value) => {
        count.value = value;
      },
      onError: (error) => console.error(error),
    });

    const runningUsage = createUsageCounter({
      read: async () => {
        const rows = await ipc("profiles:lifecycle-rows");
        return {
          count: Array.isArray(rows)
            ? rows.filter((row) => row?.openStatus).length
            : 0,
        };
      },
      update: (value) => {
        running.value = value;
      },
      onError: (error) => console.error(error),
    });

    const refreshAll = () =>
      Promise.all([totalUsage.refresh(), runningUsage.refresh()]);

    const openProfilesTab = (activeTabId) => {
      void globalThis.__router?.push({
        path: "/browser/list",
        query: activeTabId ? { activeTabId } : {},
      });
    };

    onMounted(async () => {
      dispose = globalThis.ops.onEvent((event) => {
        if (["profiles", "profile-delta", "status"].includes(event.type)) {
          void refreshAll();
        }
      });
      await refreshAll();
    });

    onBeforeUnmount(() => {
      totalUsage.dispose();
      runningUsage.dispose();
      dispose?.();
    });

    return () => {
      const compactSummary = `${$t("窗口总数")} ${count.value} · ${$t("运行中")} ${running.value} · ${$t("本地窗口无限制")}`;

      return h(
        "div",
        {
          class: ["rx-layout-footer", { collapsed: props.collapsed }],
          "data-testid": "local-usage",
        },
        [
          props.collapsed
            ? h(
                "button",
                {
                  type: "button",
                  class: [
                    "local-usage-compact",
                    { "has-running": running.value > 0 },
                  ],
                  "aria-label": compactSummary,
                  title: compactSummary,
                  onClick: () => openProfilesTab("rx_1000"),
                },
                [
                  h("span", { class: "local-usage-compact-icon" }, [
                    h(Icon, {
                      name: "base/rx_ic_browser",
                      size: 16,
                    }),
                    running.value > 0
                      ? h("span", {
                          class: "local-usage-compact-dot",
                          "aria-hidden": "true",
                        })
                      : null,
                  ]),
                  h(
                    "span",
                    { class: "local-usage-compact-count" },
                    formatCompactCount(count.value),
                  ),
                ],
              )
            : h("div", { class: "local-usage-card" }, [
                h("div", { class: "local-usage-header" }, [
                  h("span", { class: "local-usage-workspace" }, [
                    h("span", {
                      class: "local-usage-workspace-dot",
                      "aria-hidden": "true",
                    }),
                    h(
                      "span",
                      { class: "local-usage-workspace-name" },
                      $t("本地工作区"),
                    ),
                  ]),
                  h(
                    "span",
                    {
                      class: "local-usage-unlimited",
                      title: $t("本地窗口无限制"),
                    },
                    [
                      h(Icon, {
                        name: "base/rx_ic_infinity",
                        size: 13,
                        "aria-hidden": "true",
                      }),
                      h("span", null, $t("无限制")),
                    ],
                  ),
                ]),
                h("div", { class: "local-usage-metrics" }, [
                  h(
                    "button",
                    {
                      type: "button",
                      class: "local-usage-metric",
                      "data-testid": "local-usage-total",
                      title: `${$t("窗口总数")}：${count.value}（${$t("本地窗口无限制")}）`,
                      onClick: () => openProfilesTab("rx_1000"),
                    },
                    [
                      h(
                        "span",
                        { class: "local-usage-metric-value" },
                        String(count.value),
                      ),
                      h(
                        "span",
                        { class: "local-usage-metric-label" },
                        $t("窗口总数"),
                      ),
                    ],
                  ),
                  h(
                    "button",
                    {
                      type: "button",
                      class: [
                        "local-usage-metric",
                        { "is-active": running.value > 0 },
                      ],
                      "data-testid": "local-usage-running",
                      title: `${$t("运行中")}：${running.value}`,
                      onClick: () => openProfilesTab("rx_1003"),
                    },
                    [
                      h("span", { class: "local-usage-metric-value" }, [
                        h("span", {
                          class: [
                            "local-usage-status-dot",
                            { "is-live": running.value > 0 },
                          ],
                          "aria-hidden": "true",
                        }),
                        String(running.value),
                      ]),
                      h(
                        "span",
                        { class: "local-usage-metric-label" },
                        $t("运行中"),
                      ),
                    ],
                  ),
                ]),
              ]),
        ],
      );
    };
  },
};
