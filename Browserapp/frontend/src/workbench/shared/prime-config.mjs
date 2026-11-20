import { i as mergePreset } from './_Primitives_tokens-N0m8cQDB.js';
import { defaultPreset, installPrimeServices } from './workbench-prime-runtime.js';
import { workbenchPreset } from './workbench-theme-preset.js';

function installPrimeVue(app) {
  installPrimeServices(app, {
    ripple: true,
    theme: { options: { prefix: '', darkModeSelector: '.app-dark' }, preset: mergePreset(defaultPreset, workbenchPreset) },
    pt: { splitbutton: { pcMenu: { item: 'text-3.25' } } },
  });
}

export { i, n, r } from './workbench-prime-runtime.js';
export { installPrimeVue as t };
