'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'ui-dialogs.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

assert.ok(index.includes('id="app-confirm-dialog"'), 'confirm dialog is part of the app shell');
assert.ok(index.includes('src="ui/ui-dialogs.js"'), 'confirm dialog controller is loaded');
const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
assert.ok(!/\bconfirm\s*\(/.test(codeOnly), 'confirmation UI never falls back to the native dialog');
assert.ok(!/\.innerHTML\s*=/.test(source), 'confirmation UI is built without HTML string injection');
assert.ok(source.includes('document.activeElement'), 'confirmation UI captures its trigger for focus restoration');
assert.ok(source.includes('triggerEl.focus'), 'confirmation UI restores focus after closing');
assert.ok(source.includes("e.key === 'Escape'"), 'confirmation UI supports Escape to cancel');
assert.ok(source.includes('removeEventListener'), 'confirmation UI cleans up one-shot listeners');
assert.ok(source.includes('options.confirmLabel'), 'confirmation UI supports the shared confirmLabel contract');

// Workbench dialogs mount in independent Vue roots in the same document.
// Evaluate two instances of the real SFC setup without needing a display.
const simpleDialog = fs.readFileSync(path.join(__dirname, '../../frontend/src/workbench/shared/SimpleDialog.vue'), 'utf8');
const sharedScript = simpleDialog.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
const setupScript = simpleDialog.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm, '');
const mountSimpleDialog = vm.runInNewContext(`
  ${sharedScript}
  () => {
    ${setupScript}
    return formId;
  }
`, {
  defineProps() {}, defineEmits() {}, onBeforeMount() {}, ref: value => ({ value }),
});
const firstForm = mountSimpleDialog(), secondForm = mountSimpleDialog();
assert.notStrictEqual(firstForm, secondForm, 'stacked dialog footer buttons must address different forms');
assert.match(simpleDialog, /<Form\b[^>]*:id="formId"/);
assert.match(simpleDialog, /<Button\b[^>]*type="submit"[^>]*:form="formId"/);
assert.match(simpleDialog, /<slot name="footer"[^>]*:form-id="formId"/);

console.log('ui-dialogs-selftest: OK');
