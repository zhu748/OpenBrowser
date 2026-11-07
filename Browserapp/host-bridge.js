/**
 * Desktop host API bridge.
 * The host runtime injects its built-in module under a fixed id; resolve it here only.
 * Plain-text require: obfuscating the module name adds nothing for an
 * open-source app and only hurts auditability.
 */
module.exports = require('electron');
