import { ref } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';
import { i as defineStore } from './agent-BmSFI9WH.js';

const pinStatus = { none: 0, pinned: 1, 0: 'none', 1: 'pinned' };
const useProjects = defineStore('project', () => {
  const projects = ref([]);
  let request;
  function getProjects() {
    request ??= api.limit.userGetTopProjectInfoList().then(result => {
      projects.value = result.data?.rows ?? [];
      return result;
    }).finally(() => { request = undefined; });
    return request;
  }
  return { projects, getProjects };
});

export { pinStatus as n, useProjects as t };
