"use strict";

async function api(service, p, method) {
  return require("../local-api").request(service, method.slice(4), p);
}

async function extensions(service, p, method) {
  return service.extensions.request(method.slice(11), p);
}

async function accounts(service, p, method) {
  return require("../accounts").requestAccounts(service, method.slice(9), p);
}

module.exports = [
  ["api:", api, "serial"],
  ["extensions:", extensions, "serial"],
  ["accounts:", accounts, "serial"],
];
