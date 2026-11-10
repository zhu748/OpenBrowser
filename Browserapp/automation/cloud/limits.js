'use strict';

// Writer and restore paths share these bounds: a generated backup must fit
// the same file count, decoded byte and package limits as its reader.
module.exports = Object.freeze({
  MAX_BACKUP_PACKAGE_BYTES: 100 * 1024 * 1024,
  MAX_BACKUP_JSON_BYTES: 120 * 1024 * 1024,
  MAX_BROWSER_DATA_BYTES: 80 * 1024 * 1024,
  MAX_BROWSER_FILE_BYTES: 25 * 1024 * 1024,
  MAX_BROWSER_DATA_FILES: 2000,
  MAX_REMOTE_RESPONSE_BYTES: 120 * 1024 * 1024,
  MAX_REMOTE_ERROR_BYTES: 64 * 1024,
});
