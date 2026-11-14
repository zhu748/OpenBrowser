import {r as e} from "./basecomponent-ClhuVxJN.js";
var t = e.extend({ name: "rating", style: `
    .p-rating {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: dt('rating.gap');
    }

    .p-rating-option {
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        outline-color: transparent;
        border-radius: 50%;
        transition:
            background dt('rating.transition.duration'),
            color dt('rating.transition.duration'),
            border-color dt('rating.transition.duration'),
            outline-color dt('rating.transition.duration'),
            box-shadow dt('rating.transition.duration');
    }

    .p-rating-option.p-focus-visible {
        box-shadow: dt('rating.focus.ring.shadow');
        outline: dt('rating.focus.ring.width') dt('rating.focus.ring.style') dt('rating.focus.ring.color');
        outline-offset: dt('rating.focus.ring.offset');
    }

    .p-rating-icon {
        color: dt('rating.icon.color');
        transition:
            background dt('rating.transition.duration'),
            color dt('rating.transition.duration'),
            border-color dt('rating.transition.duration'),
            outline-color dt('rating.transition.duration'),
            box-shadow dt('rating.transition.duration');
        font-size: dt('rating.icon.size');
        width: dt('rating.icon.size');
        height: dt('rating.icon.size');
    }

    .p-rating:not(.p-disabled):not(.p-readonly) .p-rating-option:hover .p-rating-icon {
        color: dt('rating.icon.hover.color');
    }

    .p-rating-option-active .p-rating-icon {
        color: dt('rating.icon.active.color');
    }

    .p-rating-icon.p-invalid {
        /* @todo */
        stroke: dt('rating.invalid.icon.color');
    }

    .p-rating.p-readonly .p-rating-option {
        cursor: not-allowed;
    }
`, classes: { root: function(e2) {
  var t2 = e2.props;
  return ["p-rating", { "p-readonly": t2.readonly, "p-disabled": t2.disabled }];
}, option: function(e2) {
  var t2 = e2.instance, n = e2.value;
  return ["p-rating-option", { "p-rating-option-active": n <= t2.d_value, "p-focus-visible": n === t2.focusedOptionIndex && t2.isFocusVisibleItem }];
}, onIcon: function(e2) {
  return ["p-rating-icon p-rating-on-icon", { "p-invalid": e2.instance.$invalid }];
}, offIcon: function(e2) {
  return ["p-rating-icon p-rating-off-icon", { "p-invalid": e2.instance.$invalid }];
} } });
export {t as t};