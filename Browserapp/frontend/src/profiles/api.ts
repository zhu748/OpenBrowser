import { request } from '../desktop';

export interface ProfileRow {
  id: string;
  windowName: string;
  windowRemark?: string;
  windowSortNum?: number;
  os?: string;
  coreType?: string;
  openStatus?: boolean;
  trashedAt?: string;
}

export function queryProfiles(page: number, size: number, search: string, trash: boolean, projectId?: string) {
  return request<{ rows: ProfileRow[]; total: number }>('profiles:query', {
    page_index: page, page_size: size, queryValue: search, isDelete: trash, ...(projectId && { projectId }),
  });
}

export function readProfile(id: string) {
  return request<ProfileRow & { rev: number }>('profiles:read', { id });
}

export function editProfile(id: string, rev: number, patch: Record<string, unknown>) {
  return request('profiles:update', { ...patch, id, rev });
}
