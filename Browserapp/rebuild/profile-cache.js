"use strict";
const { acquireProfileMaintenance } = require("../engine/profile-maintenance");
const { validateProfileRootSecure } = require("../automation/isolation");
const {
  assertProfileRestoreReady,
} = require("../automation/cloud/file-restore");
const {
  clearBrowserCache,
  removeBrowserFiles,
  isFirefoxProfile,
} = require("../automation/browser-data");
async function clearLocalCache(engine, payload) {
  const ids = [...new Set((payload.dirIds || []).map(String))];
  if (
    !ids.length ||
    ids.length > 200 ||
    !["partial", "all"].includes(payload.clearType)
  )
    throw Error("无效缓存清理参数");
  const profiles = ids.map((id) => engine.profileForEdit(id).profile);
  const lease = acquireProfileMaintenance(engine, ids),
    completed = [];
  try {
    // Validate the whole selection before deleting even the first cache file.
    for (const profile of profiles) {
      const root = engine.profileRoot(profile.id);
      const check = await validateProfileRootSecure(
        engine.profileDataRootPath,
        root,
        profile.id,
      );
      if (!check.ok) throw Error("Isolation error: " + check.message);
      await assertProfileRestoreReady(root);
    }
    for (const profile of profiles) {
      const root = engine.profileRoot(profile.id);
      await clearBrowserCache(root, profile);
      if (payload.clearType === "all")
        await removeBrowserFiles(
          root,
          isFirefoxProfile(profile)
            ? [
                "extensions",
                "browser-extension-data",
                "extension-preferences.json",
                "extension-settings.json",
                "extension-store",
              ]
            : [
                "Default/Extensions",
                "Default/Extension State",
                "Default/Extension Scripts",
                "Default/Local Extension Settings",
                "Default/Sync Extension Settings",
                "Default/Extension Rules",
              ],
        );
      completed.push(profile.id);
    }
    return { success: true, ids: completed, clearType: payload.clearType };
  } catch (error) {
    error.completedIds = completed;
    throw error;
  } finally {
    lease.release();
  }
}
module.exports = { clearLocalCache };
