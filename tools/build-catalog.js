#!/usr/bin/env node
'use strict';

// Regenerate archive/catalog.json — the manifest the firmware picker reads from
// GitHub Pages. Run this whenever you add, remove or replace a .bin in archive/.
// No dependencies beyond Node's standard library.
//
//   node tools/build-catalog.js
//
// The manifest lists every *.bin in archive/ with its byte size and SHA-256, and
// the app turns each entry into a download URL on the GitHub Pages mirror.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const archiveDir = path.join(__dirname, '..', 'archive');

function main() {
  if (!fs.existsSync(archiveDir)) {
    console.error(`archive/ directory not found at ${archiveDir}`);
    process.exit(1);
  }

  const firmwares = fs.readdirSync(archiveDir)
    .filter(name => name.toLowerCase().endsWith('.bin'))
    .sort((a, b) => a.localeCompare(b))
    .map(name => {
      const buf = fs.readFileSync(path.join(archiveDir, name));
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
      return { name, size: buf.length, sha256 };
    });

  const manifest = {
    generatedAt: new Date().toISOString(),
    firmwares
  };

  const outPath = path.join(archiveDir, 'catalog.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${firmwares.length} firmware entr${firmwares.length === 1 ? 'y' : 'ies'} to ${outPath}`);
}

main();
