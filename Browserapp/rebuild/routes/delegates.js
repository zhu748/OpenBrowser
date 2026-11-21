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

async function agent(service, p, method) {
  return service.agent.request(method.slice(6), p);
}

async function cookieRobot(service, p, method) {
  return service.robot.request(method.slice(13), p);
}

module.exports = [
  // Agent owns a separate store and queue. Cookie Robot still waits for local
  // metadata migration before delegating to its own scheduler.
  ["agent:", agent, "parallel", false],
  ["cookie-robot:", cookieRobot, "parallel"],
  ["api:", api, "serial"],
  ["extensions:", extensions, "serial"],
  ["accounts:list", accounts, "parallel", false],
  ["accounts:import-preview", accounts, "parallel", false],
  ["accounts:export", accounts, "parallel", false],
  ["accounts:export-template", accounts, "parallel", false],
  ["accounts:", accounts, "serial"],
];
