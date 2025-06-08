import { downloadCSVWithTimeout } from './download'
import { deleteRemovedProducts } from './cleanupOldProducts'
import { updateDuckDBFromPostgres } from './updateDuckDB'
import { syncToPostgres } from './process'
import fs from 'fs'
import { parseCSVAndWriteIDs } from './csv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const DATA_DIR = path.resolve(__dirname, 'temp')
export const LOGS_DIR = path.resolve(__dirname, 'logs')

export const CSV_FILENAME = 'natural_diamonds.csv'
export const CSV_PATH = path.join(DATA_DIR, CSV_FILENAME)

export const TEMP_ID_FILENAME = 'natural_diamonds_current_ids.txt'

export const TEMP_ID_PATH = path.join(DATA_DIR, TEMP_ID_FILENAME)

export const CSV_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/38809e77-7647-48e0-8de1-a81428818aa4'

export async function syncsNaturalDiamonds() {
  const downloaded = await downloadCSVWithTimeout(CSV_PATH, CSV_URL, DATA_DIR)
  if (!downloaded) return console.error('❌ Download failed. Sync aborted.')

  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV not found after download. Sync aborted.')
    return
  }

  const parseSuccess = await parseCSVAndWriteIDs(CSV_PATH, TEMP_ID_PATH)
  if (!parseSuccess) {
    console.error('❌ Failed to parse CSV or write diamond_ids.')
    return
  }

  try {
    await syncToPostgres(CSV_PATH, 'natural_diamonds')
    await deleteRemovedProducts('natural_diamonds')
    await updateDuckDBFromPostgres('natural_diamonds')
    console.log('✅ Sync completed successfully.')
  } catch (e) {
    console.error('❌ Sync error:', e)
  }
}
