import { inject, provide } from './workbench-vue.js';

const profileMonitorContext = Symbol('ProfileMonitorContext');

export function provideProfileMonitor(open, available, runningTaskCount) {
  function toggle() {
    if (available.value) open.value = !open.value;
  }
  provide(profileMonitorContext, { open, available, runningTaskCount, toggle });
}

export function useProfileMonitor() {
  const monitor = inject(profileMonitorContext);
  if (!monitor) throw Error('ProfileMonitorToggle must be used inside agent-console');
  return monitor;
}
