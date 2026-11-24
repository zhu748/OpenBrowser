'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function sha256File(file) {
  const hash = createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(256 * 1024);
  try {
    let length;
    while ((length = fs.readSync(fd, buffer)) !== 0) hash.update(buffer.subarray(0, length));
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function workbenchDigest(root) {
  const hash = createHash('sha256');
  const required = new Set(['index.html', 'source-frontend/index.html']);
  function visit(file, relative) {
    const stat = fs.lstatSync(file);
    if (stat.isDirectory()) {
      hash.update(JSON.stringify([relative, 'directory']) + '\n');
      for (const name of fs.readdirSync(file).sort()) {
        visit(path.join(file, name), relative ? relative + '/' + name : name);
      }
    } else if (relative && stat.isFile()) {
      if (stat.size) required.delete(relative);
      hash.update(JSON.stringify([relative, 'file', sha256File(file)]) + '\n');
    } else {
      throw new Error('Unexpected workbench entry: ' + file);
    }
  }
  visit(root, '');
  if (required.size) throw new Error('Missing workbench entry: ' + [...required].join(', '));
  return hash.digest('hex');
}

if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/package-digests.js <built-workbench-directory>');
    console.log(workbenchDigest(process.argv[2]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { sha256File, workbenchDigest };
