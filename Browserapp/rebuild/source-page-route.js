import {
  St as ref,
  D as h,
  V as onMounted,
  R as onBeforeUnmount,
} from './runtime-core.esm-bundler-CBj16o9G.js';

function sourcePageRoute(label, mount, fallback) {
  const SourcePage = {
    props: { sourceOptions: Object },
    setup(props) {
      const host = ref(null);
      const failed = ref(false);
      let disposed = false;
      let unmount;
      onMounted(async () => {
        try {
          const render = await mount(props.sourceOptions || {});
          if (!disposed) unmount = render(host.value);
        } catch (error) {
          if (disposed) return;
          console.warn(`[OpenBrowser] source page ${label} could not mount:`, error);
          failed.value = true;
        }
      });
      onBeforeUnmount(() => { disposed = true; unmount?.(); });
      return () => failed.value ? (fallback ? h(fallback) : h('p', { role: 'alert' }, '无法加载此页面，请刷新重试。')) : h('div', { ref: host });
    },
  };
  return {
    props: { legacy: Boolean, sourceOptions: Object },
    setup(props) {
      return () => props.legacy && fallback ? h(fallback) : h(SourcePage, {
        key: props.sourceOptions?.key, sourceOptions: props.sourceOptions,
      });
    },
  };
}

export { sourcePageRoute };
