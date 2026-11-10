'use strict';

/** Browser-kernel IPC domain, registered through the host sender guard. */
function registerKernelIpc({ registerTrustedIpc, engine, dialog, platform = process.platform }) {
  registerTrustedIpc('kernel:status', () => engine.kernelStatus());
  registerTrustedIpc('kernel:download', async (_event, force) => engine.ensureIndependentKernel(Boolean(force)));
  registerTrustedIpc('kernel:check-update', async () => engine.checkKernelUpdate());
  registerTrustedIpc('kernel:set-custom', async (_event, binaryPath) => engine.setCustomKernel(String(binaryPath || '')));
  registerTrustedIpc('kernel:policy', async (_event, policy) => engine.setKernelPolicy(policy || {}));
  registerTrustedIpc('kernel:list-versions', async (_event, engineFamily, refresh) => {
    if (engineFamily === 'firefox') return engine.kernelManager.listFirefoxVersions({ refresh: Boolean(refresh) });
    return engine.kernelManager.listChromiumVersions({ refresh: Boolean(refresh) });
  });
  registerTrustedIpc('kernel:install-version', async (_event, engineFamily, version) => {
    const wanted = String(version || '').trim();
    if (!wanted) throw new Error('Missing version');
    if (engineFamily === 'firefox') return engine.kernelManager.installFirefoxVersion(wanted);
    return engine.kernelManager.installChromiumVersion(wanted);
  });
  registerTrustedIpc('kernel:list-installed', () => engine.kernelManager.listInstalledKernels());
  registerTrustedIpc('kernel:delete', async (_event, engineFamily, version) => {
    if (engineFamily !== 'firefox' && engineFamily !== 'chromium') throw new Error('Unknown engine');
    return engine.kernelDelete(engineFamily, String(version || '').trim());
  });
  registerTrustedIpc('kernel:check', async (_event, engineFamily, version) => {
    if (engineFamily !== 'firefox' && engineFamily !== 'chromium') throw new Error('Unknown engine');
    return engine.kernelCheck(engineFamily, String(version || '').trim());
  });
  registerTrustedIpc('kernel:cancel-download', () => engine.kernelCancelDownload());
  registerTrustedIpc('kernel:pin', async (_event, engineFamily, version) => {
    if (engineFamily !== 'firefox' && engineFamily !== 'chromium') throw new Error('Unknown engine');
    return engine.kernelManager.pinKernel({ engine: engineFamily, version: String(version || '').trim() });
  });
  registerTrustedIpc('kernel:unpin', async () => engine.kernelManager.clearPin());
  registerTrustedIpc('kernel:choose-custom', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择独立 Chromium / Chrome / Firefox 可执行文件',
      properties: ['openFile'],
      filters: platform === 'win32'
        ? [{ name: 'Executable', extensions: ['exe'] }]
        : [{ name: 'All', extensions: ['*'] }],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const kernel = await engine.setCustomKernel(result.filePaths[0]);
    return { canceled: false, kernel };
  });
}

module.exports = { registerKernelIpc };
