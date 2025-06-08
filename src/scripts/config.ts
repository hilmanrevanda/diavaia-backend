import path from 'path'
import { fileURLToPath } from 'url'

// Gantikan __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const DATA_DIR = path.resolve(__dirname, 'temp')
export const LOGS_DIR = path.resolve(__dirname, 'logs')

export const CSV_FILENAME = 'latest-laboratory-colored-diamond.csv'
export const CSV_PATH = path.join(DATA_DIR, CSV_FILENAME)

export const TEMP_ID_FILENAME = 'laboratory-colored-diamond_current_ids.txt'

export const TEMP_ID_PATH = path.join(DATA_DIR, TEMP_ID_FILENAME)

// Ganti dengan URL signed link atau FTP proxy kamu
export const CSV_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/fee1444f-166f-4c3a-8323-d3f0aeaac28d'

// PostgreSQL connection string dari .env
export const POSTGRES_URL = process.env.DATABASE_URI!

// DuckDB file location
export const DUCKDB_PATH = path.resolve(__dirname, 'data.duckdb')

import fs from 'fs/promises'

export async function ensureTempFolderAndFile() {
  try {
    // Buat folder temp jika belum ada
    await fs.mkdir(DATA_DIR, { recursive: true })

    // Cek file ada atau tidak, kalau tidak ada buat file kosong
    try {
      await fs.access(TEMP_ID_PATH)
    } catch {
      await fs.writeFile(TEMP_ID_PATH, '', 'utf-8')
    }
  } catch (error) {
    console.error('Failed to ensure temp folder and id file:', error)
    throw error
  }
}
