import type { Request } from '../desktop';

export interface TemplateRow {
  id: number;
  templateName: string;
}

type ImportResult = { canceled: true } | { count: number };

export interface TemplateActions {
  list: () => Promise<TemplateRow[]>;
  remove: (id: number) => Promise<void>;
  importFile: () => Promise<ImportResult>;
  openEditor: (id?: number) => Promise<void>;
}

export function templateActions(request: Request, openEditor: TemplateActions['openEditor']): TemplateActions {
  return {
    list: () => request<TemplateRow[]>('templates:list'),
    async remove(id) {
      await request('templates:delete', { ids: [id] });
    },
    importFile: () => request<ImportResult>('transfer:import'),
    openEditor,
  };
}
