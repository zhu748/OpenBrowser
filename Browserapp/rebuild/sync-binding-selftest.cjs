"use strict";
const assert = require("node:assert/strict"),
  vm = require("node:vm");
const { injection } = require("../live-sync-v4");
const listeners = new Map(),
  payloads = [];
class Element {
  constructor() {
    this.id = "local-field";
    this.tagName = "INPUT";
    this.type = "text";
    this.value = "after global removal";
    this.name = "";
    this.placeholder = "";
    this.selectionStart = 1;
    this.selectionEnd = 1;
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 100, height: 30 };
  }
  getRootNode() {
    return document;
  }
  getAttribute() {
    return null;
  }
}
const document = {
  addEventListener: (name, fn) => listeners.set(name, fn),
  visibilityState: "visible",
  hasFocus: () => true,
};
const window = {
  openBrowserSync: (value) => payloads.push(JSON.parse(value)),
  addEventListener: () => {},
};
window.top = window;
vm.runInNewContext(injection, {
  window,
  document,
  Element,
  ShadowRoot: class ShadowRoot {},
  CSS: { escape: (v) => v },
  Number,
  JSON,
  Object,
  String,
  Math,
  setTimeout: () => 1,
  clearTimeout: () => {},
  requestAnimationFrame: () => 1,
  addEventListener: () => {},
});
assert.ok(listeners.has("input"));
delete window.openBrowserSync;
const target = new Element();
listeners.get("input")({
  target,
  composedPath: () => [target],
  inputType: "insertText",
  data: "x",
});
assert.equal(
  window.openBrowserSync,
  undefined,
  "不能恢复会暴露给页面的同步全局",
);
assert.equal(payloads.at(-1).type, "input");
assert.equal(payloads.at(-1).value, "after global removal");
console.log(
  "PASS: input reaches captured CDP binding after fullscreen bridge removes its global; global stays absent",
);
