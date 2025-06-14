import { downloadCSVWithTimeout } from './download'
import { deleteRemovedProducts } from './cleanupOldProducts'
import { updateDuckDBFromPostgres } from './updateDuckDB'
import fs from 'fs'
import { parseCSVAndWriteIDs } from './csv'
import { fileURLToPath } from 'url'
import path from 'path'
import { syncToPostgres } from './process-lab-grown-white'
import ExcelJS from 'exceljs'

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

const EXCEL_PATH = path.resolve(__dirname, 'USA_stock_list.xlsx')
const EXCEL_ETHEREAL_PATH = path.resolve(__dirname, 'stock_list.xlsx')

type EtherealMap = Map<
  string,
  {
    cut: string
    vid_1: string
    vid_2: string
    aset: string
  }
>

type CutwiseMap = Map<string, string>

async function loadEthereal(path: string): Promise<EtherealMap> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)
  const worksheet = workbook.worksheets[0]

  const cutwiseMap: EtherealMap = new Map()

  worksheet.eachRow((row) => {
    const certNo = row.getCell(25).value?.toString().trim()
    const ethereal_cut = row.getCell(11).value?.toString().trim()
    const ethereal_vid_1 = row.getCell(28).value?.toString().trim()
    const ethereal_vid_2 = row.getCell(29).value?.toString().trim()
    const ethereal_aset = row.getCell(30).value?.toString().trim()

    if (certNo) {
      const values = [ethereal_cut, ethereal_vid_1, ethereal_vid_2, ethereal_aset]
      const nonEmptyCount = values.filter((v) => v && v !== '').length

      if (nonEmptyCount >= 4) {
        const mediaLink = {
          cut: ethereal_cut ?? '-',
          vid_1: ethereal_vid_1 ?? '-',
          vid_2: ethereal_vid_2 ?? '-',
          aset: ethereal_aset ?? '-',
        }
        cutwiseMap.set(certNo, mediaLink)
      }
    }
  })

  return cutwiseMap
}

async function loadCutwiseData(path: string): Promise<CutwiseMap> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)
  const worksheet = workbook.worksheets[0]

  const cutwiseMap: CutwiseMap = new Map()

  worksheet.eachRow((row) => {
    const certNo = row.getCell(2).value?.toString().trim()
    const mediaLink = row.getCell(20).value?.toString().trim()

    if (certNo && mediaLink) {
      cutwiseMap.set(certNo, mediaLink)
    }
  })

  return cutwiseMap
}

export async function syncsLaboratoryDiamond() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }
  const cutwiseMap = await loadCutwiseData(EXCEL_PATH)
  const etherealMap = await loadEthereal(EXCEL_ETHEREAL_PATH)

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
    await syncToPostgres(CSV_PATH, 'laboratory_grown_diamonds', cutwiseMap, etherealMap)
    await deleteRemovedProducts('laboratory_grown_diamonds')
    await updateDuckDBFromPostgres('laboratory_grown_diamonds')
    console.log('✅ Sync completed successfully.')
  } catch (e) {
    console.error('❌ Sync error:', e)
  }
}
