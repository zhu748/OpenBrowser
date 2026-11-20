import { J as renderSlot, P as mergeProps, W as openBlock, h as createElementBlock } from './runtime-core.esm-bundler-CBj16o9G.js';
import { i as uniqueId } from './baseicon-Z_5Hqu9u.js';
import { t as style } from './style-CSCMuhHp.js';
import { t as BaseEditableHolder } from './baseeditableholder-DHdW4ii2.js';

const RadioButtonGroup = {
  name: 'RadioButtonGroup',
  extends: {
    name: 'BaseRadioButtonGroup',
    extends: BaseEditableHolder,
    style,
    provide() {
      return { $pcRadioButtonGroup: this, $parentInstance: this };
    },
  },
  inheritAttrs: false,
  data() {
    return { groupName: this.name };
  },
  watch: {
    name(value) {
      this.groupName = value || uniqueId('radiobutton-group-');
    },
  },
  mounted() {
    this.groupName ||= uniqueId('radiobutton-group-');
  },
  render() {
    openBlock();
    return createElementBlock('div', mergeProps({ class: this.cx('root') }, this.ptmi('root')), [
      renderSlot(this.$slots, 'default'),
    ], 16);
  },
};

export default RadioButtonGroup;
