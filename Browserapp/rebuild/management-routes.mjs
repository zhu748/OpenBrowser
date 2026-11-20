import { sourcePageRoute } from './source-page-route.js';
import { S as defineAsyncComponent } from './runtime-core.esm-bundler-CBj16o9G.js';

function managementRoute(kind, fallback) {
  return sourcePageRoute(kind, async options => {
    const { mountManagement } = await import('/source-frontend/management.js');
    const router = globalThis.__router;
    const query = { renderer: 'source' };
    const project = id => router.push({
      path: id ? '/projects/' + encodeURIComponent(id) : '/projects/list',
      query,
    });
    const screen = {
      kind,
      ...options,
      openProject: project,
      openProfile: (id, projectId) => router.push(id
        ? { path: '/browser/edit', query: { id } }
        : { path: '/projects/' + encodeURIComponent(projectId) + '/new-window', query }),
      openAccounts: create => router.push({ path: create ? '/account/create' : '/account/list', query }),
      done: () => project(options.id),
    };
    return host => mountManagement(host, screen);
  }, fallback && defineAsyncComponent(fallback));
}

export { managementRoute };
