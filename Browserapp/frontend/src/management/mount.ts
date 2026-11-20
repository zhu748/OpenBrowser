import AccountsPage from './AccountsPage.vue';
import ApiSettingsPage from './ApiSettingsPage.vue';
import ExtensionsPage from './ExtensionsPage.vue';
import ProjectsPage from './ProjectsPage.vue';
import ProfileEditor from '../profiles/ProfileEditor.vue';
import { mountPage } from '../mount-shadow';
import css from './management.css?inline';
import extensionsCss from './extensions.css?inline';

export type ManagementScreen =
  | { kind: 'projects'; id?: string; openProject: (id?: string) => unknown; openProfile: (id?: string, projectId?: string) => unknown }
  | { kind: 'project-editor'; id: string; done: () => void }
  | { kind: 'accounts'; create?: boolean; openAccounts: (create?: boolean) => unknown }
  | { kind: 'extensions' }
  | { kind: 'api' };

export function mountManagement(host: HTMLElement, screen: ManagementScreen): () => void {
  switch (screen.kind) {
    case 'projects':
      return mountPage(host, ProjectsPage, { id: screen.id, openProject: screen.openProject, openProfile: screen.openProfile }, css);
    case 'project-editor':
      return mountPage(host, ProfileEditor, {
        id: null, templateId: null, templateMode: false, batch: false, projectId: screen.id, done: screen.done,
      }, css);
    case 'accounts':
      return mountPage(host, AccountsPage, { create: screen.create, openAccounts: screen.openAccounts }, css);
    case 'extensions':
      return mountPage(host, ExtensionsPage, {}, css + extensionsCss);
    case 'api':
      return mountPage(host, ApiSettingsPage, {}, css);
  }
}
