'use strict';

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

function resolvePersonaScreen({ profile, privacy, fpIn, mobileDevice, devicePersona, width, height, uaOs }) {
  // A persona carries its own panel size; without it the reported screen follows the window,
  // which is what makes "screen smaller than the viewport" style inconsistencies show up.
  // Phones report the full display, and their floor is far below the desktop minimum the window
  // sync assumes, so the panel comes from the persona without the desktop clamp.
  // privacy.resolutionMode === 'real' (跟随系统) opts out of the drawn panel: the engine passes
  // the host's real display bounds via profile.hostScreen and every screen field follows them.
  const mobileScreen = mobileDevice ? mobileDevice.screen : null;
  const hostScreen = (profile.hostScreen && Number(profile.hostScreen.width) >= 640 && Number(profile.hostScreen.height) >= 480)
    ? { width: Math.round(Number(profile.hostScreen.width)), height: Math.round(Number(profile.hostScreen.height)) }
    : null;
  const followHostScreen = String(privacy.resolutionMode || '') === 'real' && !mobileScreen && Boolean(hostScreen);
  const screenWidth = followHostScreen
    ? hostScreen.width
    : mobileScreen
      ? Math.round(Number(fpIn.screenWidth) || mobileScreen.width)
      : Math.max(640, Math.round(Number(fpIn.screenWidth) || devicePersona?.screen?.width || width));
  const screenHeight = followHostScreen
    ? hostScreen.height
    : mobileScreen
      ? Math.round(Number(fpIn.screenHeight) || mobileScreen.height)
      : Math.max(480, Math.round(Number(fpIn.screenHeight) || devicePersona?.screen?.height || height));
  const taskbarHeight = mobileScreen
    ? 0
    : Math.max(0, Math.round(Number(fpIn.taskbarHeight) || devicePersona?.screen?.taskbarHeight || (uaOs === 'macos' || uaOs === 'macos_arm' ? 25 : 40)));
  const availLeft = Math.round(Number(fpIn.availLeft) || 0);
  const availTop = Math.round(Number(fpIn.availTop) || 0);
  const availWidth = Math.min(screenWidth, Math.max(1, Math.round(Number(fpIn.availWidth) || screenWidth)));
  const availHeight = Math.min(screenHeight, Math.max(1, Math.round(Number(fpIn.availHeight) || (screenHeight - taskbarHeight))));
  const screenX = Math.max(availLeft, Math.round(Number(fpIn.screenX) || availLeft));
  const screenY = Math.max(availTop, Math.round(Number(fpIn.screenY) || availTop));

  return { screenWidth, screenHeight, availWidth, availHeight, availLeft, availTop, screenX, screenY };
}

module.exports = { inferGpuFromRenderer, resolvePersonaScreen };
