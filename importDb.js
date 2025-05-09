#!/usr/bin/env node

/**
 * ES Module script to import all MongoDB dump files from ./src/db
 * into the current database, dropping existing collections first.
 * Includes verbose output to help debug and support for loading environment variables from a .env file.
 *
 * Usage:
 *   1. Ensure `mongorestore` is installed and available in your PATH.
 *   2. Create a .env file in your project root with DATABASE_URI set.
 *   3. Run: `node importDb.js`
 */

// Load environment variables from .env (must be installed via `npm install dotenv`)
import 'dotenv/config';
import { spawn } from 'child_process';
import { resolve } from 'path';
import fs from 'fs';

// MongoDB connection URI (override via env var)
const uri = process.env.DATABASE_URI;
if (!uri) {
  console.error('Error: DATABASE_URI is not set. Please define it in your .env file or environment.');
  process.exit(1);
}

// Directory containing dumped BSON files
const dumpDir = resolve(process.cwd(), 'src', 'db');

// Ensure the dump directory exists and contains files
if (!fs.existsSync(dumpDir)) {
  console.error(`Error: dump directory not found: ${dumpDir}`);
  process.exit(1);
}
const entries = fs.readdirSync(dumpDir);
const hasData = entries.some(entry => {
  const fullPath = resolve(dumpDir, entry);
  return entry.endsWith('.bson') || fs.lstatSync(fullPath).isDirectory();
});
if (!hasData) {
  console.error(`Error: no dump files found in: ${dumpDir}`);
  process.exit(1);
}

console.log(`Running mongorestore on: ${uri}`);
console.log(`Import directory: ${dumpDir}`);

// Spawn mongorestore for real-time verbose logs
const restoreProcess = spawn(
  'mongorestore',
  ['--uri', uri, '--drop', '--dir', dumpDir, '--verbose'],
  { stdio: 'inherit', shell: true }
);

restoreProcess.on('error', err => {
  console.error(`Failed to start mongorestore: ${err.message}`);
  process.exit(1);
});

restoreProcess.on('exit', code => {
  if (code !== 0) {
    console.error(`mongorestore exited with code ${code}`);
    process.exit(code);
  }
  console.log(`mongorestore completed successfully.`);
});
