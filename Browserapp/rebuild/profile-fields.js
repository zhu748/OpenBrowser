"use strict";

// Workbench aliases and window-position encoding are shared in both directions.
const ADVANCED_FIELDS = Object.freeze({
  syncCookie: "syncCookiesOnClose",
  syncIndexedDb: "syncIndexedDB",
  syncLocalStorage: "syncLocalStorage",
  syncSessionStorage: "syncSessionStorage",
  syncPassword: "syncPasswords",
  syncExtensions: "syncExtensionData",
  syncTab: "syncTab",
  syncHistory: "syncHistory",
  clearCacheFile: "clearCacheOnStart",
  clearCookie: "clearCookiesOnStart",
  clearLocalStorage: "clearLocalStorageOnStart",
  stopOpenNet: "stopOpenNet",
  stopOpenIP: "stopOpenIPChange",
  stopOpenPosition: "stopOpenIPCountryChange",
  openBookmarks: "showBookmarkBar",
});

const NOISE_FIELDS = Object.freeze({
  canvas: "canvas",
  webGL: "webgl",
  audioContext: "audio",
  clientRects: "clientRects",
  speechVoices: "speech",
});


const WINDOW_POSITIONS = Object.freeze({
  "tl": "0,0,tl",
  "tm": "0.5,0,tl",
  "tr": "1,0,tr",
  "ml": "0,0.5,tl",
  "mm": "0.5,0.5,tl",
  "mr": "1,0.5,tr",
  "bl": "0,1,bl",
  "bm": "0.5,1,bl",
  "br": "1,1,br"
});
const POSITION_KEYS = new Map(Object.entries(WINDOW_POSITIONS).map(([key, value]) => [value.split(',').slice(0, 2).join(','), key]));
function parseWindowPosition(value) {
  const pair = String(value).split(',').slice(0, 2).map(Number).join(',');
  const position = POSITION_KEYS.get(pair);
  if (!position) throw Error("无效的窗口位置");
  return position;
}
function labelIdsOf(profile) {
  const tag = profile.tag;
  return typeof tag === "string" && /^\d+(,\d+)*$/.test(tag) ? tag.split(",").map(Number) : [];
}
function formatWindowPosition(value) { return WINDOW_POSITIONS[value] || WINDOW_POSITIONS.tl; }
module.exports = { labelIdsOf, ADVANCED_FIELDS, NOISE_FIELDS, parseWindowPosition, formatWindowPosition };
