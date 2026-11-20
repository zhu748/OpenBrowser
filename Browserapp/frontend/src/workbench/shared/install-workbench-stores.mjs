import { createPinia } from './workbench-pinia.js';
import persistedState from './workbench-pinia-persistence.js';

function installWorkbenchStores(app) {
  const stores = createPinia();
  stores.use(persistedState);
  app.use(stores);
}
export { installWorkbenchStores as r };
export { default as t } from './workbench-global-ui.js';
