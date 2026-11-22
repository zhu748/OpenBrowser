"use strict";

// Compatibility entry for engine callers; endpoint rules belong to networking.
const identity = require("../network/proxy-identity");

module.exports = { ...identity };
