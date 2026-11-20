'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { copyProductionDependencies } = require('../main/production-dependencies');
const { isRuntimeResource } = require('../scripts/runtime-manifest');

function copySourceOnlyApp(source, destination) {
  fs.cpSync(source, destination, { recursive: true, filter(file) {
    if (file === source) return true;
    const relative = path.relative(source, file).split(path.sep).join('/');
    if (relative === 'kernels' || relative.startsWith('kernels/')) return false;
    const sourceAssets = relative === 'roxy-ui/source-frontend' || relative.startsWith('roxy-ui/source-frontend/');
    if (relative.startsWith('roxy-ui/') && !sourceAssets) return false;
    return isRuntimeResource(relative);
  } });
  copyProductionDependencies(source, destination);
  assert.ok(!fs.existsSync(path.join(destination, 'roxy-ui/assets')));
  assert.ok(!fs.existsSync(path.join(destination, 'frontend/dist')));
}

function launchVisualApp(appRoot, data, renderer = 'source') {
  return electron.launch({
    executablePath: require('electron'),
    args: [
      ...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []),
      '--force-device-scale-factor=1', '--force-color-profile=srgb', '--disable-threaded-animation',
      '--disable-lcd-text', '--disable-skia-runtime-opts', '--disable-font-subpixel-positioning',
      '--disable-partial-raster', '--disable-oop-rasterization', appRoot,
    ],
    env: { ...process.env, OPENBROWSER_RENDERER: renderer, OPENBROWSER_USER_DATA: data,
      OPENBROWSER_API_PORT: '0', OPENBROWSER_MASTER_KEY_FILE: path.join(data, 'master.key') },
  });
}

async function waitForPaint(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function captureStableScreenshot(page, file, target = page) {
  let previous, consecutive = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    await waitForPaint(page);
    const frame = await target.screenshot({ scale: 'css', caret: 'hide', animations: 'allow' });
    consecutive = previous?.equals(frame) ? consecutive + 1 : 1;
    if (consecutive === 3) {
      fs.writeFileSync(file, frame);
      return;
    }
    previous = frame;
  }
  throw Error('Screenshot did not settle: ' + file);
}

module.exports = { copySourceOnlyApp, launchVisualApp, waitForPaint, captureStableScreenshot };
