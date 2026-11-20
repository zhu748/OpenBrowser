import { mountPage } from '../mount-shadow';
import { type Request, type Subscribe } from '../desktop';
import { kernelActions, type KernelOps } from './api';
import KernelsPage from './KernelsPage.vue';
import css from './kernels.css?inline';

export function mountKernels(host: HTMLElement, adapters: { request: Request; subscribe: Subscribe; ops: KernelOps }): () => void {
  return mountPage(host, KernelsPage, { actions: kernelActions(adapters.request, adapters.subscribe, adapters.ops) }, css);
}
