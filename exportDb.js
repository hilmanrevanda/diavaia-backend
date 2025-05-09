#!/usr/bin/env node

/**
 * ES Module script to export the current MongoDB database for a PayloadCMS project
 * into the ./src/db folder (flattening the database-named subdirectory).
 * Supports loading the DATABASE_URI from a .env file via dotenv.
 * Cleans the target directory before export and includes verbose output and directory listing.
 *
 * Usage:
 *   1. Install dependencies: `pnpm add -D dotenv`
 *   2. Create a `.env` file in your project root with:
 *      DATABASE_URI=mongodb://username:password@host:port/your-db
 *   3. Run: `node exportDb.js`
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import { resolve, join } from 'path';
import fs from 'fs';

// MongoDB connection URI (from .env or environment)
const uri = process.env.DATABASE_URI;
if (!uri) {
  console.error('Error: DATABASE_URI is not set. Please define it in your .env file or environment.');
  process.exit(1);
}

// Output directory relative to project root
const outDir = resolve(process.cwd(), 'src', 'db');

// Ensure the output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Clean up existing contents
console.log(`Cleaning target directory: ${outDir}`);
fs.readdirSync(outDir).forEach(entry => {
  const targetPath = join(outDir, entry);
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`Removed: ${targetPath}`);
  } catch (err) {
    console.error(`Failed to remove ${targetPath}: ${err.message}`);
  }
});

console.log(`Running mongodump on: ${uri}`);
console.log(`Output directory: ${outDir}`);

// Spawn mongodump for real-time verbose logs
const dumpProcess = spawn(
  'mongodump',
  ['--uri', uri, '--out', outDir, '--verbose'],
  { stdio: 'inherit', shell: true }
);

dumpProcess.on('error', (err) => {
  console.error(`Failed to start mongodump: ${err.message}`);
  process.exit(1);
});

dumpProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`mongodump exited with code ${code}`);
    process.exit(code);
  }

  console.log(`mongodump completed successfully.`);
  console.log(`Flattening export directory...`);

  // Flatten the dumped files: move contents of the <dbName> subdir up and remove it
  try {
    const entries = fs.readdirSync(outDir);
    entries.forEach((entry) => {
      const fullPath = join(outDir, entry);
      if (fs.lstatSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        files.forEach((file) => {
          fs.renameSync(join(fullPath, file), join(outDir, file));
        });
        fs.rmdirSync(fullPath);
        console.log(`Removed subdirectory: ${entry}`);
      }
    });

    // List resulting files
    const finalFiles = fs.readdirSync(outDir);
    console.log(`Final contents of ${outDir}:`);
    finalFiles.forEach((f) => console.log(` - ${f}`));

    console.log(`Export and flatten complete.`);
  } catch (flatErr) {
    console.error(`Error flattening export directory: ${flatErr.message}`);
    process.exit(1);
  }
});