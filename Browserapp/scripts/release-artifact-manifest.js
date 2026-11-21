'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createReadStream } = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');

async function artifactManifest(directory, releaseTag, sourceSha, name) {
  assert.match(name, /^OpenBrowser-[A-Za-z0-9_.-]+$/);
  const hash = crypto.createHash('sha256');
  for await (const chunk of createReadStream(path.join(directory, name))) hash.update(chunk);
  return { version: 1, releaseTag, sourceSha, name, sha256: hash.digest('hex') };
}

async function main([command, directory, releaseTag, sourceSha, ...assets]) {
  assert.match(sourceSha || '', /^[a-f0-9]{40}$/);
  assert.ok(directory && releaseTag && assets.length && new Set(assets).size === assets.length);
  assert.ok(['create', 'verify'].includes(command));

  const checksums = [];
  for (const name of assets) {
    const manifest = await artifactManifest(directory, releaseTag, sourceSha, name);
    const filename = path.join(directory, `${name}.build.json`);
    if (command === 'create') {
      await fs.writeFile(filename, JSON.stringify(manifest, null, 2) + '\n');
    } else {
      const recorded = JSON.parse(await fs.readFile(filename, 'utf8'));
      assert.deepEqual(recorded, manifest, `${name} does not match the release, source commit or recorded checksum`);
      checksums.push(`${manifest.sha256} *${name}\n`);
    }
  }
  if (command === 'verify') await fs.writeFile(path.join(directory, 'SHA256SUMS.txt'), checksums.join(''));
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
