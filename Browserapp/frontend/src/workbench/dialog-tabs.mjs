import { k as inject, st as watch } from './runtime-core.esm-bundler-CBj16o9G.js';

export const nativeDialogTab = Symbol('native dialog tab');

export function watchNativeDialogTab(select) {
  const selection = inject(nativeDialogTab, null);
  if (selection) watch(selection, request => select(request.tab), { immediate: true });
}
