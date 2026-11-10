'use strict';

// Offline test for the System Native theme's light/dark/auto resolution. The
// theme system is a browser script (uses window/document at load), so we
// extract the two pure functions from its source and run them in a sandbox —
// this exercises the ACTUAL shipped logic, not a copy.

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// The color-mode resolution moved from renderer.js into renderer-theme.js
// (second renderer.js split): the behaviour assertions scan the module, and
// one wiring assertion keeps index.html tied to it (a0e755e pattern).
const src = fs.readFileSync(path.join(__dirname, 'renderer-theme.js'), 'utf8');
{
  const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const themeTag = index.indexOf('src="renderer-theme.js');
  const rendererTag = index.indexOf('src="renderer.js');
  assert.ok(themeTag >= 0 && rendererTag > themeTag,
    'index.html must load renderer-theme.js before renderer.js');
}
const grab = (name, re) => {
  const m = src.match(re);
  if (!m) throw new Error(`could not extract ${name} from renderer-theme.js`);
  return m[0];
};
const resolveSrc = grab('resolveColorMode', /function resolveColorMode\(pref, prefersDark\) \{[\s\S]*?\n\}/);
const readSrc = grab('readSavedColorPreference', /function readSavedColorPreference\(\) \{[\s\S]*?\n\}/);

// Provide the constant + a fake localStorage the extracted code closes over.
let storeValue = null;
const localStorage = { getItem: () => storeValue };
const UI_COLOR_MODE_KEY = 'openbrowser-ui-color-mode-v1';
const systemPrefersDark = () => false; // never called (we always pass prefersDark explicitly)
const { resolveColorMode, readSavedColorPreference } = new Function(
  'localStorage', 'UI_COLOR_MODE_KEY', 'systemPrefersDark',
  `${resolveSrc}\n${readSrc}\nreturn { resolveColorMode, readSavedColorPreference };`,
)(localStorage, UI_COLOR_MODE_KEY, systemPrefersDark);

let passed = 0;
const ok = (n, c) => { assert.ok(c, n); console.log('  PASS  ' + n); passed += 1; };

// resolveColorMode: explicit preferences ignore the system value
ok("light stays light (system dark)", resolveColorMode('light', true) === 'light');
ok("light stays light (system light)", resolveColorMode('light', false) === 'light');
ok("dark stays dark (system light)", resolveColorMode('dark', false) === 'dark');
ok("dark stays dark (system dark)", resolveColorMode('dark', true) === 'dark');
// auto follows the system
ok("auto + system dark -> dark", resolveColorMode('auto', true) === 'dark');
ok("auto + system light -> light", resolveColorMode('auto', false) === 'light');
// fallbacks
ok("unknown preference -> light", resolveColorMode('nonsense', false) === 'light');
ok("undefined preference -> light", resolveColorMode(undefined, true) === 'light');

// readSavedColorPreference: valid stored values pass through, everything else defaults to auto
storeValue = null;     ok("no stored value -> auto (follow system)", readSavedColorPreference() === 'auto');
storeValue = 'auto';   ok("stored 'auto' -> auto", readSavedColorPreference() === 'auto');
storeValue = 'light';  ok("stored 'light' -> light", readSavedColorPreference() === 'light');
storeValue = 'dark';   ok("stored 'dark' -> dark", readSavedColorPreference() === 'dark');
storeValue = 'garbage';ok("stored garbage -> auto", readSavedColorPreference() === 'auto');

console.log(`\ncolor-mode-selftest: ${passed} checks passed.`);
