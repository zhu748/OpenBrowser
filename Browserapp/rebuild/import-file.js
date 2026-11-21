"use strict";

const fs = require("node:fs/promises");
const { O_RDONLY, O_NONBLOCK } = require("node:fs").constants;

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

async function readImportFile(filename) {
  const handle = await fs.open(filename, O_RDONLY | O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw Error("请选择普通文件");
    if (stat.size > MAX_IMPORT_BYTES) throw Error("导入文件不能超过 5 MiB");
    const data = new Uint8Array(stat.size + 1);
    let size = 0;
    while (size < data.length) {
      const { bytesRead } = await handle.read(data, size, data.length - size, size);
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > MAX_IMPORT_BYTES) throw Error("导入文件不能超过 5 MiB");
    const current = await handle.stat();
    if (size !== stat.size || current.size !== stat.size || current.mtimeMs !== stat.mtimeMs) {
      throw Error("导入文件已更改，请重新选择");
    }
    return data.subarray(0, size);
  } finally {
    await handle.close();
  }
}

module.exports = { MAX_IMPORT_BYTES, readImportFile };
