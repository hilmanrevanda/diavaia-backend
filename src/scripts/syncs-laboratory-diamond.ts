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

export const CSV_FILENAME = 'laboratory_grown_diamonds.csv'
export const CSV_PATH = path.join(DATA_DIR, CSV_FILENAME)

export const TEMP_ID_FILENAME = 'laboratory_grown_diamonds_current_ids.txt'

export const TEMP_ID_PATH = path.join(DATA_DIR, TEMP_ID_FILENAME)

export const CSV_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/12042853-d999-4793-9cc5-d6fda64e3ad3'

export async function syncsLaboratoryDiamond() {
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
    await syncToPostgres(CSV_PATH, 'laboratory_grown_diamonds')
    await deleteRemovedProducts('laboratory_grown_diamonds')
    await updateDuckDBFromPostgres('laboratory_grown_diamonds')
    console.log('✅ Sync completed successfully.')
  } catch (e) {
    console.error('❌ Sync error:', e)
  }
}
