import { createApp, type Component } from 'vue';

export function mountPage(host: HTMLElement, component: Component, props: Record<string, unknown>, css: string): () => void {
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = css;
  const container = document.createElement('div');
  container.className = 'source-page-root';
  root.replaceChildren(style, container);
  const app = createApp(component, props);
  app.mount(container);
  return () => {
    app.unmount();
    root.replaceChildren();
  };
}
