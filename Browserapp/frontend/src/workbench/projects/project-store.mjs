import { ref } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { i as defineStore } from './agent-BmSFI9WH.js';

const pinStatus = { none: 0, pinned: 1, 0: 'none', 1: 'pinned' };
const useProjects = defineStore('project', () => {
  const projects = ref([]);
  let request;
  let dirty = false;
  function getProjects({ afterChange = false } = {}) {
    if (!request || afterChange) dirty = true;
    request ??= Promise.resolve().then(async () => {
      try {
        while (dirty) {
          dirty = false;
          try {
            const result = await api.limit.userGetTopProjectInfoList();
            if (dirty) continue; // This read started before a newer metadata event.
            if (result.code === 0) projects.value = result.data?.rows ?? [];
            return result;
          } catch (error) {
            if (!dirty) throw error;
          }
        }
      } finally {
        request = undefined;
      }
    });
    return request;
  }
  return { projects, getProjects };
});

export { pinStatus as n, useProjects as t };
