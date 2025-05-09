#!/usr/bin/env node

/**
 * ES Module script to export the current MongoDB database for a PayloadCMS project
 * into the ./src/db folder (flattening the database-named subdirectory).
 *
 * Usage:
 *   1. Ensure `mongodump` is installed and available in your PATH.
 *   2. Set the DATABASE_URI environment variable (or update the default URI below).
 *   3. Run: `node exportDb.js`
 */

import { exec } from 'child_process';
import { resolve, join } from 'path';
import fs from 'fs';

// MongoDB connection URI (override via env var)
const uri = process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/diavaia-backend';
// Output directory relative to project root
const outDir = resolve(process.cwd(), 'src', 'db');

// Ensure the output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Build the mongodump command
const cmd = `mongodump --uri="${uri}" --out="${outDir}"`;
console.log(`Running: ${cmd}`);

exec(cmd, { shell: true }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error exporting database: ${error.message}`);
    process.exit(1);
  }
  if (stderr) {
    console.error(`mongodump stderr: ${stderr}`);
  }
  console.log(`Database exported to: ${outDir}`);

  // Flatten the dumped files: move contents of the db-named subdir up and remove it
  try {
    const entries = fs.readdirSync(outDir);
    for (const entry of entries) {
      const fullPath = join(outDir, entry);
      if (fs.lstatSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        for (const file of files) {
          const srcPath = join(fullPath, file);
          const destPath = join(outDir, file);
          fs.renameSync(srcPath, destPath);
        }
        fs.rmdirSync(fullPath);
        console.log(`Flattened export directory; removed subdirectory: ${entry}`);
      }
    }
    console.log(`Flatten complete: all files moved to ${outDir}`);
  } catch (flatErr) {
    console.error(`Error flattening export directory: ${flatErr.message}`);
    process.exit(1);
  }

  if (stdout) console.log(stdout);
});