import { computed } from './workbench-vue.js';
import { a as storeToRefs } from './agent-BmSFI9WH.js';
import { at as useRole, mt as useWorkspace, Dt as isPrivate, Ot as normalizeWorkspaceType,
  Pt as isPublicMember, Ut as WorkspaceRole, tn as WorkspaceType } from './utils-BIWenCnY.js';

function useRouteContext() {
  const { isOwner } = storeToRefs(useRole());
  const { currentWorkspace } = storeToRefs(useWorkspace());
  const ctx = computed(() => {
    const { workspaceType: rawType, role, id } = currentWorkspace.value ?? {};
    const workspaceType = normalizeWorkspaceType(rawType);
    return { workspaceType, workspaceId: id, isOwner: isOwner.value ?? role === WorkspaceRole.OWNER,
      isEcommerce: workspaceType === WorkspaceType.ECommerce, isNormal: isPrivate(workspaceType),
      isPublicMember: isPublicMember(workspaceType, role) };
  });
  return { ctx, workspaceType: computed(() => ctx.value.workspaceType), isEcommerce: computed(() => ctx.value.isEcommerce),
    isNormal: computed(() => ctx.value.isNormal), isPublicMember: computed(() => ctx.value.isPublicMember) };
}

export { useRouteContext as n };
