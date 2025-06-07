import path from 'path'
import { fileURLToPath } from 'url'

// Gantikan __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const DATA_DIR = path.resolve(__dirname, 'temp')
export const LOGS_DIR = path.resolve(__dirname, 'logs')

export const CSV_FILENAME = 'latest-feed.csv'
export const CSV_PATH = path.join(DATA_DIR, CSV_FILENAME)

export const TEMP_ID_FILENAME = 'current_ids.txt'
export const TEMP_ID_PATH = path.join(DATA_DIR, TEMP_ID_FILENAME)

// Ganti dengan URL signed link atau FTP proxy kamu
export const CSV_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/4f81b734-1d57-4f8c-ac6f-64bef4afc3cb'

// PostgreSQL connection string dari .env
export const POSTGRES_URL = process.env.DATABASE_URI!

// DuckDB file location
export const DUCKDB_PATH = path.resolve(__dirname, 'data.duckdb')
