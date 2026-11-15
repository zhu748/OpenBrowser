"use strict";

// Timezone arguments and optional desktop display queries; no launch or profile state.

function isValidIanaTimezone(tz) {
  if (!tz || typeof tz !== "string") return false;
  const trimmed = tz.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch (_) {
    return false;
  }
}

function extractTimezoneFromArgs(args) {
  if (!Array.isArray(args)) return null;
  for (let i = args.length - 1; i >= 0; i -= 1) {
    const item = String(args[i] || "");
    if (item.startsWith("--time-zone-for-testing=")) {
      const val = item.slice("--time-zone-for-testing=".length).trim();
      return val || null;
    }
  }
  return null;
}

function hostScreenSummary() {
  // Requiring the npm Electron launcher under plain Node can download a binary.
  // Only the Electron main process exposes the screen service used here.
  if (!process.versions.electron) return null;
  try {
    const { screen } = require("electron");
    const display = screen.getPrimaryDisplay();
    const width = Number(display?.bounds?.width);
    const height = Number(display?.bounds?.height);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width >= 640 &&
      height >= 480
    ) {
      return { width, height };
    }
  } catch (_) {}
  return null;
}

const WINDOW_POSITION_RATIOS = {
  tl: [0, 0],
  tm: [0.5, 0],
  tr: [1, 0],
  ml: [0, 0.5],
  mm: [0.5, 0.5],
  mr: [1, 0.5],
  bl: [0, 1],
  bm: [0.5, 1],
  br: [1, 1],
};

function windowPositionArg(profile) {
  if (!process.versions.electron) return null;
  const cell = String(profile.privacy?.windowPos || "");
  const ratios = WINDOW_POSITION_RATIOS[cell];
  if (!ratios) return null;
  try {
    const { screen } = require("electron");
    const workArea = screen.getPrimaryDisplay().workArea;
    const width = Math.min(Number(profile.width) || 1280, workArea.width);
    const height = Math.min(Number(profile.height) || 820, workArea.height);
    const x = Math.round((workArea.width - width) * ratios[0]) + workArea.x;
    const y = Math.round((workArea.height - height) * ratios[1]) + workArea.y;
    return `--window-position=${Math.max(workArea.x, x)},${Math.max(workArea.y, y)}`;
  } catch (_) {
    return null;
  }
}

module.exports = {
  isValidIanaTimezone,
  extractTimezoneFromArgs,
  hostScreenSummary,
  windowPositionArg,
};
