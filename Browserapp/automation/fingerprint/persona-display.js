'use strict';

const { MAX_FINGERPRINT_DPR, toFiniteNumber } = require('../../shared/profile-values');

// GPU identity inference and display projection have no random draws or I/O.
const inferGpuFromRenderer = (rendererStr) => {
    const s = String(rendererStr || '').toLowerCase();
    if (s.includes('nvidia') || s.includes('geforce') || s.includes('quadro') || s.includes('rtx') || s.includes('gtx')) {
      let arch = 'ampere';
      if (s.includes('40') || s.includes('ada')) arch = 'ada';
      else if (s.includes('30') || s.includes('ampere')) arch = 'ampere';
      else if (s.includes('20') || s.includes('16') || s.includes('turing')) arch = 'turing';
      else if (s.includes('10') || s.includes('pascal')) arch = 'pascal';
      return { vendor: 'nvidia', architecture: arch };
    }
    if (s.includes('intel') || s.includes('arc') || s.includes('iris') || s.includes('uhd') || s.includes('hd graphics')) {
      let arch = 'gen12';
      if (s.includes('arc') || s.includes('alchemist')) arch = 'alchemist';
      else if (s.includes('iris') || s.includes('770') || s.includes('gen12')) arch = 'gen12';
      else if (s.includes('630') || s.includes('620') || s.includes('gen9')) arch = 'gen9';
      return { vendor: 'intel', architecture: arch };
    }
    if (s.includes('amd') || s.includes('radeon')) {
      let arch = 'rdna-2';
      if (s.includes('7900') || s.includes('7800') || s.includes('7700') || s.includes('7600') || s.includes('780m') || s.includes('rdna-3') || s.includes('rdna3')) arch = 'rdna-3';
      else if (s.includes('6900') || s.includes('6800') || s.includes('6700') || s.includes('6600') || s.includes('680m') || s.includes('rdna-2') || s.includes('rdna2')) arch = 'rdna-2';
      else if (s.includes('580') || s.includes('570') || s.includes('590')) arch = 'gcn-4';
      return { vendor: 'amd', architecture: arch };
    }
    if (s.includes('apple') || s.includes('m1') || s.includes('m2') || s.includes('m3')) {
      return { vendor: 'apple', architecture: 'common-3' };
    }
    return null;
  };

function resolvePersonaScreen({ profile, privacy, fpIn, mobileDevice, devicePersona, width, height, uaOs, devicePixelRatio }) {
  // A persona carries its own panel size; without it the reported screen follows the window,
  // which is what makes "screen smaller than the viewport" style inconsistencies show up.
  // Phones report the full display, and their floor is far below the desktop minimum the window
  // sync assumes, so the panel comes from the persona without the desktop clamp.
  // Following the system keeps saved custom bounds inactive. Desktop can
  // use the host display; mobile and headless runs use the selected panel.
  const followsSystem = privacy.resolutionMode === 'real';
  const overrides = followsSystem ? {} : fpIn;
  const mobileScreen = mobileDevice ? mobileDevice.screen : null;
  const hostScreen = followsSystem && !mobileScreen ? profile.hostScreen : null;
  const hostWidth = toFiniteNumber(hostScreen?.width);
  const hostHeight = toFiniteNumber(hostScreen?.height);
  const followHostScreen = hostWidth >= 640 && hostHeight >= 480;
  const screenWidth = followHostScreen
    ? Math.round(hostWidth)
    : mobileScreen
      ? Math.round(Number(overrides.screenWidth) || mobileScreen.width)
      : Math.max(640, Math.round(Number(overrides.screenWidth) || devicePersona?.screen?.width || width));
  const screenHeight = followHostScreen
    ? Math.round(hostHeight)
    : mobileScreen
      ? Math.round(Number(overrides.screenHeight) || mobileScreen.height)
      : Math.max(480, Math.round(Number(overrides.screenHeight) || devicePersona?.screen?.height || height));
  const taskbarHeight = mobileScreen
    ? 0
    : Math.max(0, Math.round(toFiniteNumber(overrides.taskbarHeight)
      ?? (devicePersona?.screen?.taskbarHeight || (uaOs === 'macos' || uaOs === 'macos_arm' ? 25 : 40))));
  const available = followHostScreen ? hostScreen : overrides;
  const availLeft = Math.min(screenWidth - 1, Math.max(0, Math.round(toFiniteNumber(available.availLeft) ?? 0)));
  const availTop = Math.min(screenHeight - 1, Math.max(0, Math.round(toFiniteNumber(available.availTop) ?? 0)));
  const remainingWidth = screenWidth - availLeft;
  const remainingHeight = screenHeight - availTop;
  const availWidth = Math.min(remainingWidth, Math.max(1, Math.round(toFiniteNumber(available.availWidth) || remainingWidth)));
  const availHeight = Math.min(remainingHeight, Math.max(1, Math.round(toFiniteNumber(available.availHeight) || (screenHeight - taskbarHeight))));
  const screenX = Math.max(availLeft, Math.round(Number(overrides.screenX) || availLeft));
  const screenY = Math.max(availTop, Math.round(Number(overrides.screenY) || availTop));
  const configuredDpr = toFiniteNumber(available.devicePixelRatio);
  const dpr = configuredDpr > 0 && configuredDpr <= MAX_FINGERPRINT_DPR ? configuredDpr : devicePixelRatio;

  return { screenWidth, screenHeight, availWidth, availHeight, availLeft, availTop, screenX, screenY, dpr };
}

module.exports = { inferGpuFromRenderer, resolvePersonaScreen };
