/* eslint-disable @typescript-eslint/no-explicit-any */
import { createReadStream, existsSync, renameSync, mkdirSync } from 'fs'
import { finished } from 'stream/promises'
import { createWriteStream } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import csv from 'csv-parser'
import { MongoClient } from 'mongodb'
import axios from 'axios'

const FILE_A_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/12042853-d999-4793-9cc5-d6fda64e3ad3'
const FILE_DIR = join(process.cwd(), 'data')
const CACHE_DIR = join(process.cwd(), 'cache')
const FILE_A_PATH = join(FILE_DIR, 'laboratory-grown-diamonds.csv')
const MONGO_URI = process.env.DATABASE_URI!
const COLLECTION_NAME = 'laboratory-grown-diamonds'

mkdirSync(FILE_DIR, { recursive: true })
mkdirSync(CACHE_DIR, { recursive: true })

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
              color: row.col,
              clarity: row.clar,
              cut: row.cut,
              polish: row.pol,
              symmetry: row.symm,
              fluorescence: row.flo,
              fluorescenceColor: row.floCol,
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
              pavilionAngle: parseFloat(row.pavAngle || '0'),
              pavilionHeight: parseFloat(row.pavHeight || '0'),
              pavilionDepth: parseFloat(row.pavDepth || '0'),
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
              canada_mark_eligible: row.canada_mark_eligible.toLowerCase() === 'true',
              is_returnable: row.is_returnable.toLowerCase() === 'y',
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

export async function syncsLaboratoryDiamond() {
  const mongo = new MongoClient(MONGO_URI)
  await mongo.connect()
  const collection = mongo.db().collection(COLLECTION_NAME)

  try {
    const aReady = await downloadFile(FILE_A_URL, FILE_A_PATH)
    if (!aReady) throw new Error('Missing file')

    console.log('⏳ Syncing')
    const fileAIds = await streamAndUpsertCSV(FILE_A_PATH, collection, new Set())

    console.log('🧹 Deleting outdated items...')
    await deleteMissing(collection, fileAIds)
  } catch (err: any) {
    console.error('❌ Sync failed:', err.message)
  } finally {
    await mongo.close()
    console.log('🔌 MongoDB connection closed')
  }
}
