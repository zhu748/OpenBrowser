import {r as e} from "./basecomponent-ClhuVxJN.js";
var t = e.extend({ name: "divider", style: `
    .p-divider-horizontal {
        display: flex;
        width: 100%;
        position: relative;
        align-items: center;
        margin: dt('divider.horizontal.margin');
        padding: dt('divider.horizontal.padding');
    }

    .p-divider-horizontal:before {
        position: absolute;
        display: block;
        inset-block-start: 50%;
        inset-inline-start: 0;
        width: 100%;
        content: '';
        border-block-start: 1px solid dt('divider.border.color');
    }

    .p-divider-horizontal .p-divider-content {
        padding: dt('divider.horizontal.content.padding');
    }

    .p-divider-vertical {
        min-height: 100%;
        display: flex;
        position: relative;
        justify-content: center;
        margin: dt('divider.vertical.margin');
        padding: dt('divider.vertical.padding');
    }

    .p-divider-vertical:before {
        position: absolute;
        display: block;
        inset-block-start: 0;
        inset-inline-start: 50%;
        height: 100%;
        content: '';
        border-inline-start: 1px solid dt('divider.border.color');
    }

    .p-divider.p-divider-vertical .p-divider-content {
        padding: dt('divider.vertical.content.padding');
    }

    .p-divider-content {
        z-index: 1;
        background: dt('divider.content.background');
        color: dt('divider.content.color');
    }

    .p-divider-solid.p-divider-horizontal:before {
        border-block-start-style: solid;
    }

    .p-divider-solid.p-divider-vertical:before {
        border-inline-start-style: solid;
    }

    .p-divider-dashed.p-divider-horizontal:before {
        border-block-start-style: dashed;
    }

    .p-divider-dashed.p-divider-vertical:before {
        border-inline-start-style: dashed;
    }

    .p-divider-dotted.p-divider-horizontal:before {
        border-block-start-style: dotted;
    }

    .p-divider-dotted.p-divider-vertical:before {
        border-inline-start-style: dotted;
    }

    .p-divider-left:dir(rtl),
    .p-divider-right:dir(rtl) {
        flex-direction: row-reverse;
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-divider p-component", "p-divider-" + t2.layout, "p-divider-" + t2.type, { "p-divider-left": t2.layout === "horizontal" && (!t2.align || t2.align === "left") }, { "p-divider-center": t2.layout === "horizontal" && t2.align === "center" }, { "p-divider-right": t2.layout === "horizontal" && t2.align === "right" }, { "p-divider-top": t2.layout === "vertical" && t2.align === "top" }, { "p-divider-center": t2.layout === "vertical" && (!t2.align || t2.align === "center") }, { "p-divider-bottom": t2.layout === "vertical" && t2.align === "bottom" }];
}, content: "p-divider-content" }, inlineStyles: { root: function(e2) {
  var t2 = e2.props;
  return { justifyContent: t2.layout === "horizontal" ? t2.align === "center" || t2.align === null ? "center" : t2.align === "left" ? "flex-start" : t2.align === "right" ? "flex-end" : null : null, alignItems: t2.layout === "vertical" ? t2.align === "center" || t2.align === null ? "center" : t2.align === "top" ? "flex-start" : t2.align === "bottom" ? "flex-end" : null : null };
} } });
export {t as t};