import { t as AnimatedBorder } from "./animation-border-Bx_8JoE6.js";
import {
  D as h,
  St as ref,
  V as onMounted,
  R as onBeforeUnmount,
} from "./runtime-core.esm-bundler-CBj16o9G.js";
import { t as Button } from "./rx-button-DyzuUt-V.js";
import { Z as Icon } from "./basecomponent-ClhuVxJN.js";
const ipc = (method, payload = {}) =>
  globalThis.__localRequest(method, payload);
const button = (label, icon, onClick, props = {}) =>
  h(Button, {
    severity: "secondary",
    outlined: true,
    size: "xs",
    icon,
    onClick,
    "aria-label": label,
    title: label,
    ...props,
  });
export const SidebarFooter = {
  props: { collapsed: Boolean },
  __scopeId: "data-v-e0fdeed1",
  setup(props) {
    const count = ref(0);
    let dispose;
    const load = async () => {
      count.value = (await ipc("profiles:list")).length;
    };
    onMounted(async () => {
      dispose = globalThis.ops.onEvent((event) => {
        if (["profiles", "profile-delta", "status"].includes(event.type))
          load().catch((error) => {
            console.error(error);
          });
      });
      await load();
    });
    onBeforeUnmount(() => dispose?.());
    return () =>
      h(
        "div",
        {
          class: ["rx-layout-footer", { collapsed: props.collapsed }],
          "data-testid": "local-usage",
        },
        [
          props.collapsed
            ? button(
                "窗口用量：" + count.value + "，不限量",
                "base/rx_ic_browser",
                () => globalThis.__router.push("/kernels"),
              )
            : h("div", { class: "local-usage-card" }, [
                h(
                  "div",
                  { class: "local-usage-title" },
                  h("span", { class: "local-usage-badge" }, "本地"),
                ),
                h(
                  "div",
                  {
                    class: "local-usage-progress",
                    role: "meter",
                    "aria-label": "窗口用量，不限量",
                    "aria-valuenow": count.value,
                  },
                  Array.from({ length: 5 }, (_, i) =>
                    h("div", { key: i, class: "local-usage-segment" }),
                  ),
                ),
                h("div", { class: "local-usage-stat" }, [
                  h("span", null, "窗口用量"),
                  h("span", { class: "local-usage-value" }, [
                    count.value + " / ∞ ",
                    h(Icon, {
                      name: "base/rx_ic_info",
                      size: 14,
                      color: "var(--colors-icon-icon-note)",
                      title: "本地窗口不限量",
                    }),
                  ]),
                ]),
                h(
                  AnimatedBorder,
                  {
                    class: "w-full",
                    "bg-color": "var(--pattern-sidenav-metrics-btn)",
                    gradient: [
                      "var(--local-usage-border-blue)",
                      "var(--local-usage-border-orange)",
                      "var(--local-usage-border-purple)",
                    ],
                  },
                  {
                    default: () =>
                      h(Button, {
                        class: "w-full",
                        size: "xs",
                        severity: "secondary",
                        text: true,
                        label: "内核升级",
                        onClick: () => globalThis.__router.push("/kernels"),
                      }),
                  },
                ),
              ]),
        ],
      );
  },
};
