'use strict';
// Keep the historical entry point; verify real destinations rather than a fixed echo mock.
// The parity selftest moved into automation/selftests/ alongside this shim —
// the old '../rust-core-parity-selftest' path broke in that move.
require('./rust-core-parity-selftest');
