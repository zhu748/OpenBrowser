import { Kernels as LegacyKernels } from './local-pages.js';
import { sourcePageRoute } from './source-page-route.js';

const KernelsRoute = sourcePageRoute('kernels', async () => {
  const { mountKernels } = await import('/source-frontend/kernels.js');
  return host => mountKernels(host, {
    request: (method, payload) => globalThis.__localRequest(method, payload),
    subscribe: listener => globalThis.ops.onEvent(listener),
    ops: globalThis.ops,
  });
}, LegacyKernels);

export default KernelsRoute;
