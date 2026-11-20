import { toRaw } from './workbench-vue.js';
import { h as api } from './utils-BIWenCnY.js';

async function savePreferences(preferences) {
  await globalThis.electronAPI.send('syncControl:changeSyncSettings', toRaw({ ...preferences.base, ...preferences.simulate }));
  return api.base.userSetUserConfigCreate({ preferenceSettings: preferences });
}

export { savePreferences as t };
