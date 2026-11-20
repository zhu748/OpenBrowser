export { default as n } from './workbench-check-channel-link.js';
function channelOptions(options) {
  return (options ?? []).map(option => ({ ...option, external: String(option.label ?? '').toLocaleLowerCase().includes('ip123') }));
}
export { channelOptions as t };
