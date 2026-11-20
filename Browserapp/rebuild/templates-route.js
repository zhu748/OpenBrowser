import { Templates as LegacyTemplates } from './local-pages.js';
import { sourcePageRoute } from './source-page-route.js';

const TemplatesRoute = sourcePageRoute('templates', async () => {
  const { mountTemplates } = await import('/source-frontend/templates.js');
  return host => mountTemplates(host, {
    request: (method, payload) => globalThis.__localRequest(method, payload),
    openEditor: async (id) => {
      const failure = await globalThis.__router.push({
        path: '/browser/create',
        query: id == null ? {} : { templateId: String(id) },
      });
      if (failure) throw failure;
    },
  });
}, LegacyTemplates);

export default TemplatesRoute;
