/* eslint-disable @typescript-eslint/no-explicit-any */
import { createReadStream, existsSync, renameSync, mkdirSync } from 'fs'
import { finished } from 'stream/promises'
import { createWriteStream, promises as fsPromises } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import csv from 'csv-parser'
import { MongoClient } from 'mongodb'
import axios from 'axios'

const FILE_A_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/f1bb4b3c-e938-408a-8a2d-0a67c19cf0c4'
const FILE_B_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/12042853-d999-4793-9cc5-d6fda64e3ad3'
const FILE_DIR = join(process.cwd(), 'data')
const FILE_A_PATH = join(FILE_DIR, 'laboratory-grown-diamonds-diavaia.csv')
const FILE_B_PATH = join(FILE_DIR, 'laboratory-grown-diamonds.csv')
const MONGO_URI = process.env.DATABASE_URI!
const COLLECTION_NAME = 'laboratory-grown-diamonds'
const STATE_PATH = join(FILE_DIR, 'sync-state.json')

mkdirSync(FILE_DIR, { recursive: true })

async function downloadFile(url: string, localPath: string): Promise<boolean> {
  const tempPath = join(tmpdir(), `temp-${Date.now()}-${Math.random()}`)
  try {
    console.log(`🌐 Downloading from ${url}`)
    const response = await axios({ url, responseType: 'stream', timeout: 30000 })
    const writer = createWriteStream(tempPath)
    response.data.pipe(writer)
    await finished(writer)
    renameSync(tempPath, localPath)
    console.log(`✅ Downloaded and saved to: ${localPath}`)
    return true
  } catch (err: any) {
    console.error(`⚠️ Failed to download ${url}, using existing file if exists:`, err.message)
    return existsSync(localPath)
  }
}

async function flushBulkOps(collection: any, ops: any[]) {
  if (ops.length === 0) return
  await collection.bulkWrite(ops)
  ops.length = 0
}

async function streamAndUpsertCSV(
  filePath: string,
  collection: any,
  skipIds: Set<string>,
): Promise<Set<string>> {
  const validIds = new Set<string>()
  const bulkOps: any[] = []

  const csvStream = createReadStream(filePath, { highWaterMark: 64 * 1024 }).pipe(csv())

  for await (const row of csvStream) {
    try {
      if (!row.diamond_id || skipIds.has(row.diamond_id)) continue

      const size = JSON.stringify(row).length
      if (size > 50000) {
        console.warn(`⚠️ Skipping large row: ${row.diamond_id} (${size} bytes)`)
        continue
      }

      validIds.add(row.diamond_id)

      bulkOps.push({
        updateOne: {
          filter: { diamond_id: row.diamond_id },
          update: {
            $set: {
              stock_id: row.stock_id,
              diamond_id: row.diamond_id,
              reportNo: row.ReportNo,
              shape: row.shape,
              fullShape: row.fullShape,
              carats: parseFloat(row.carats || '0'),
              color: row.color,
              clarity: row.clarity,
              cut: row.cut,
              polish: row.polish,
              symmetry: row.symmetry,
              fluorescence: row.fluorescence,
              fluorescenceColor: row.fluorescenceColor,
              eyeClean: row.eyeClean,
              brown: row.brown,
              green: row.green,
              milky: row.milky,
              length: parseFloat(row.length || '0'),
              width: parseFloat(row.width || '0'),
              height: parseFloat(row.height || '0'),
              depth: parseFloat(row.depth || '0'),
              table: parseFloat(row.table || '0'),
              culet: row.culet,
              girdle: row.girdle,
              starLength: parseFloat(row.starLength || '0'),
              lowerGirdle: parseFloat(row.lowerGirdle || '0'),
              crownHeight: parseFloat(row.crownHeight || '0'),
              crownAngle: parseFloat(row.crownAngle || '0'),
              pavilionAngle: parseFloat(row.pavilionAngle || '0'),
              pavilionHeight: parseFloat(row.pavilionHeight || '0'),
              pavilionDepth: parseFloat(row.pavilionDepth || '0'),
              discount: row.discount,
              price: parseFloat(row.price || '0'),
              markup_price: parseFloat(row.markup_price || '0'),
              markup_currency: row.markup_currency,
              price_per_carat: parseFloat(row.price_per_carat || '0'),
              deliveredPrice: parseFloat(row.deliveredPrice || '0'),
              lab: row.lab,
              pdf: row.pdf,
              video: row.video,
              image: row.image,
              videosImageUri: row.videosImageUri,
              videosFrame: parseFloat(row.videosFrame || '0'),
              blue: row.blue,
              gray: row.gray,
              minDeliveryDays: parseInt(row.minDeliveryDays || '0'),
              maxDeliveryDays: parseInt(row.maxDeliveryDays || '0'),
              country: row.country,
              mine_of_origin: row.mine_of_origin,
              canada_mark_eligible: row.canada_mark_eligible === 'TRUE',
              is_returnable: row.is_returnable === 'Y',
              published: true,
              is_diavaia: filePath.includes('diavaia'),
            },
          },
          upsert: true,
        },
      })

      if (bulkOps.length >= 500) {
        await flushBulkOps(collection, bulkOps)
      }
    } catch (err: any) {
      console.error(`❌ Error processing row ${row.diamond_id}:`, err.message)
    }
  }

  if (bulkOps.length > 0) {
    await flushBulkOps(collection, bulkOps)
  }

  console.log(`✅ Processed ${filePath.split('/').pop()} | Total: ${validIds.size} diamonds`)
  return validIds
}

async function deleteMissing(collection: any, keepIds: Set<string>) {
  const cursor = collection.find({}, { projection: { diamond_id: 1 } })
  const idsToDelete: string[] = []

  while (await cursor.hasNext()) {
    const doc = await cursor.next()
    const id = doc?.diamond_id
    if (id && !keepIds.has(id)) {
      idsToDelete.push(id)
    }

    if (idsToDelete.length >= 1000) {
      await collection.deleteMany({ diamond_id: { $in: idsToDelete } })
      idsToDelete.length = 0
    }
  }

  if (idsToDelete.length > 0) {
    await collection.deleteMany({ diamond_id: { $in: idsToDelete } })
  }

  console.log(`🧹 Deleted outdated diamonds`)
}

async function loadState() {
  try {
    const raw = await fsPromises.readFile(STATE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { processedFiles: [] }
  }
}

async function saveState(state: any) {
  await fsPromises.writeFile(STATE_PATH, JSON.stringify(state, null, 2))
}

async function processFileWithTimeout(
  filePath: string,
  collection: any,
  skipIds: Set<string>,
  timeoutMs = 10 * 60 * 1000, // 10 minutes timeout
) {
  return Promise.race([
    streamAndUpsertCSV(filePath, collection, skipIds),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout processing ${filePath}`)), timeoutMs),
    ),
  ])
}

export async function syncsLaboratoryDiamond() {
  const mongo = new MongoClient(MONGO_URI)
  await mongo.connect()
  const db = mongo.db()
  const collection = db.collection(COLLECTION_NAME)
  await collection.createIndex({ diamond_id: 1 }, { unique: true })

  const state = await loadState()
  const processedFiles: string[] = state.processedFiles || []

  try {
    const files = [
      { url: FILE_A_URL, path: FILE_A_PATH, name: 'FILE_A' },
      { url: FILE_B_URL, path: FILE_B_PATH, name: 'FILE_B' },
    ]

    const allValidIds = new Set<string>()

    for (const file of files) {
      if (processedFiles.includes(file.name)) {
        console.log(`✅ Skipping already processed ${file.name}`)

        // Jika sudah diproses, kita bisa load diamond_ids dari file tersebut untuk hapus data lama
        // Untuk performa, kamu bisa simpan validIds ke file saat proses stream selesai di streamAndUpsertCSV,
        // tapi untuk sekarang abaikan dan tambahkan secara manual atau lewat fungsi tambahan.
        continue
      }

      const ready = await downloadFile(file.url, file.path)
      if (!ready) throw new Error(`Failed to download ${file.name}`)

      console.log(`⏳ Processing ${file.name}`)
      try {
        const validIds: any = await processFileWithTimeout(file.path, collection, new Set())
        validIds.forEach((id: any) => allValidIds.add(id))
        processedFiles.push(file.name)
        await saveState({ processedFiles })
        console.log(`🎉 Processed ${file.name}`)
      } catch (err) {
        console.error(`❌ Error processing ${file.name}:`, err)
        break // Stop on error or timeout, next scheduler run will resume
      }
    }

    // Jika semua file sudah selesai, lakukan cleanup delete missing data
    if (processedFiles.length === files.length) {
      console.log('🧹 Cleaning up old data...')
      await deleteMissing(collection, allValidIds)
      // Reset state supaya proses bisa mulai dari awal di run berikutnya
      await saveState({ processedFiles: [] })
    }
  } finally {
    await mongo.close()
  }
}
