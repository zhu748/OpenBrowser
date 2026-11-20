import TemplatesPage from './TemplatesPage.vue';
import { templateActions, type TemplateActions } from './api';
import type { Request } from '../desktop';
import { mountPage } from '../mount-shadow';
import css from './templates.css?inline';

export function mountTemplates(host: HTMLElement, adapters: {
  request: Request;
  openEditor: TemplateActions['openEditor'];
}): () => void {
  return mountPage(host, TemplatesPage, { actions: templateActions(adapters.request, adapters.openEditor) }, css);
}
