import {t as AnimatedBorder} from "./animation-border-Bx_8JoE6.js";
import {D as h,St as ref,V as onMounted,R as onBeforeUnmount} from "./runtime-core.esm-bundler-CBj16o9G.js";
import {t as Button} from "./rx-button-DyzuUt-V.js";
import {Z as Icon} from "./basecomponent-ClhuVxJN.js";
const ipc = (method, payload = {}) => globalThis.__localRequest(method, payload);
const button = (label, icon, onClick, props = {}) => h(Button, {
  severity: "secondary",
  outlined: !0,
  size: "xs",
  icon,
  onClick,
  "aria-label": label,
  title: label,
  ...props
});
const SidebarFooter = {
  props: { collapsed: Boolean },
  __scopeId: "data-v-e0fdeed1",
  setup(props) {
    const count = ref(0);
    let dispose;
    const load = async () => {
      count.value = (await ipc("profiles:list")).length;
    };
    return onMounted(async () => {
      dispose = globalThis.ops.onEvent((event) => {
        ["profiles", "profile-delta", "status"].includes(event.type) && load().catch((error) => {
          console.error(error);
        });
      }), await load();
    }), onBeforeUnmount(() => dispose?.()), () => h(
      "div",
      {
        class: ["rx-layout-footer", { collapsed: props.collapsed }],
        "data-testid": "local-usage"
      },
      [
        props.collapsed ? button(
          "\u7A97\u53E3\u7528\u91CF\uFF1A" + count.value + "\uFF0C\u4E0D\u9650\u91CF",
          "base/rx_ic_browser",
          () => globalThis.__router.push("/kernels")
        ) : h("div", { class: "local-usage-card" }, [
          h(
            "div",
            { class: "local-usage-title" },
            h("span", { class: "local-usage-badge" }, "\u672C\u5730")
          ),
          h(
            "div",
            {
              class: "local-usage-progress",
              role: "meter",
              "aria-label": "\u7A97\u53E3\u7528\u91CF\uFF0C\u4E0D\u9650\u91CF",
              "aria-valuenow": count.value
            },
            Array.from(
              { length: 5 },
              (_, i) => h("div", { key: i, class: "local-usage-segment" })
            )
          ),
          h("div", { class: "local-usage-stat" }, [
            h("span", null, "\u7A97\u53E3\u7528\u91CF"),
            h("span", { class: "local-usage-value" }, [
              count.value + " / \u221E ",
              h(Icon, {
                name: "base/rx_ic_info",
                size: 14,
                color: "var(--colors-icon-icon-note)",
                title: "\u672C\u5730\u7A97\u53E3\u4E0D\u9650\u91CF"
              })
            ])
          ]),
          h(
            AnimatedBorder,
            {
              class: "w-full",
              "bg-color": "var(--pattern-sidenav-metrics-btn)",
              gradient: [
                "var(--local-usage-border-blue)",
                "var(--local-usage-border-orange)",
                "var(--local-usage-border-purple)"
              ]
            },
            {
              default: () => h(Button, {
                class: "w-full",
                size: "xs",
                severity: "secondary",
                text: !0,
                label: "\u5185\u6838\u5347\u7EA7",
                onClick: () => globalThis.__router.push("/kernels")
              })
            }
          )
        ])
      ]
    );
  }
};
export {SidebarFooter as SidebarFooter};