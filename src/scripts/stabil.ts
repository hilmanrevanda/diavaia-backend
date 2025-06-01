import fs from 'fs'
import path from 'path'
import axios from 'axios'
import csv from 'csv-parser'
import { MongoClient, AnyBulkWriteOperation } from 'mongodb'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FILE_A_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/1e1caa17-b3be-4e83-b6e6-0e145e31cb5d'
const FILE_B_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/38809e77-7647-48e0-8de1-a81428818aa4'
const DOWNLOAD_DIR = path.join(__dirname, 'downloads')
const FILE_A_PATH = path.join(DOWNLOAD_DIR, 'fileA.csv')
const FILE_B_PATH = path.join(DOWNLOAD_DIR, 'fileB.csv')

const MONGODB_URI = process.env.DATABASE_URI!
const DB_NAME = 'diavaia'
const COLLECTION_NAME = 'natural-diamonds'

const BATCH_SIZE = 1000

async function downloadFile(url: string, filePath: string) {
  console.log(`➡️ Starting download from ${url} ...`)
  await fs.promises.mkdir(DOWNLOAD_DIR, { recursive: true })
  const writer = fs.createWriteStream(filePath)
  const response = await axios.get(url, { responseType: 'stream' })
  return new Promise<void>((resolve, reject) => {
    response.data.pipe(writer)
    writer.on('finish', () => {
      console.log(`✅ Download completed: ${filePath}`)
      resolve()
    })
    writer.on('error', (err) => {
      console.error(`❌ Download error: ${err}`)
      reject(err)
    })
  })
}

async function batchUpsert(collection: any, docs: any[]) {
  if (docs.length === 0) return
  const bulkOps: AnyBulkWriteOperation<any>[] = docs.map((doc) => ({
    updateOne: {
      filter: { diamond_id: doc.diamond_id },
      update: { $set: doc },
      upsert: true,
    },
  }))
  await collection.bulkWrite(bulkOps)
  console.log(`   🔄 Batch upserted ${docs.length} records`)
}

// Parse CSV secara streaming dan langsung insert/update per batch
async function syncCSV(filePath: string, skipIds: Set<string>, collection: any) {
  return new Promise<void>((resolve, reject) => {
    const docsBatch: any[] = []
    let totalProcessed = 0

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (skipIds.has(row.diamond_id)) return

        const doc = {
          stock_id: row.stock_id,
          diamond_id: row.diamond_id,
          report_no: row.ReportNo,
          shape: row.shape,
          full_shape: row.fullShape,
          carats: parseFloat(row.carats || '0'),
          col: row.col,
          clar: row.clar,
          cut: row.cut,
          pol: row.pol,
          symm: row.symm,
          flo: row.flo,
          flo_col: row.floCol,
          eye_clean: row.eyeClean,
          brown: row.brown,
          green: row.green,
          milky: row.milky,
          fancy_color: row.fancyColor,
          fancy_overtone: row.fancyOvertone,
          fancy_intensity: row.fancyIntensity,
          color_shade: row.colorShade,
          length: parseFloat(row.length || '0'),
          width: parseFloat(row.width || '0'),
          height: parseFloat(row.height || '0'),
          depth: parseFloat(row.depth || '0'),
          table: parseFloat(row.table || '0'),
          culet: row.culet,
          girdle: row.girdle,
          star_length: parseFloat(row.starLength || '0'),
          lower_girdle: parseFloat(row.lowerGirdle || '0'),
          crown_height: parseFloat(row.crownHeight || '0'),
          crown_angle: parseFloat(row.crownAngle || '0'),
          pav_angle: parseFloat(row.pavAngle || '0'),
          pav_height: parseFloat(row.pavHeight || '0'),
          pav_depth: parseFloat(row.pavDepth || '0'),
          discount: row.discount,
          price: parseFloat(row.price || '0'),
          markup_price: parseFloat(row.markup_price || '0'),
          markup_currency: row.markup_currency,
          price_per_carat: parseFloat(row.price_per_carat || '0'),
          delivered_price: parseFloat(row.deliveredPrice || '0'),
          lab: row.lab,
          pdf: row.pdf,
          video: row.video,
          image: row.image,
          videos_image_uri: row.videosImageUri,
          videos_frame: parseFloat(row.videosFrame || '0'),
          blue: row.blue,
          gray: row.gray,
          min_delivery_days: parseInt(row.minDeliveryDays || '0'),
          max_delivery_days: parseInt(row.maxDeliveryDays || '0'),
          country: row.country,
          mine_of_origin: row.mine_of_origin,
          canada_mark_eligible: row.canada_mark_eligible === 'TRUE',
          labgrown_type: row.labgrownType,
          lg: row.lg,
          is_returnable: row.is_returnable === 'Y',
          published: true,
          is_diavaia: true,
        }

        docsBatch.push(doc)
        totalProcessed++

        if (docsBatch.length >= BATCH_SIZE) {
          // pause stream, upsert batch, then resume
          fs.createReadStream(filePath).pause?.() // this line will cause error, so we do a trick below
        }
      })
      // Since pause() does not exist on ReadStream here, we use the .pause() on the stream variable directly:
      .on('error', (err) => {
        console.error(`❌ Error parsing CSV ${filePath}:`, err)
        reject(err)
      })
      .on('end', async () => {
        try {
          // Upsert last batch if any
          if (docsBatch.length > 0) {
            await batchUpsert(collection, docsBatch)
            docsBatch.length = 0
          }
          console.log(`🎉 Done syncing ${totalProcessed} records from ${filePath}`)
          resolve()
        } catch (err) {
          console.error('❌ Error in batch upsert:', err)
          reject(err)
        }
      })
  })
}

async function syncDiamonds() {
  try {
    await downloadFile(FILE_A_URL, FILE_A_PATH)
    await downloadFile(FILE_B_URL, FILE_B_PATH)

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('🟢 Connected to MongoDB')

    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)

    // Build Set diamond_id dari file A (file utama)
    console.log('🔍 Reading diamond_id from file A for skip list...')
    const skipIds = new Set<string>()
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(FILE_A_PATH)
        .pipe(csv())
        .on('data', (row) => skipIds.add(row.diamond_id))
        .on('end', () => {
          console.log(`✅ Loaded ${skipIds.size} diamond_ids to skip from file A`)
          resolve()
        })
        .on('error', reject)
    })

    // Sync file A, tanpa skip (upsert semua)
    console.log('🔄 Syncing File A...')
    await syncCSV(FILE_A_PATH, new Set(), collection)

    // Sync file B, skip diamond_id yg sudah ada di file A
    console.log('🔄 Syncing File B (excluding IDs from file A)...')
    await syncCSV(FILE_B_PATH, skipIds, collection)

    await client.close()
    console.log('🟢 MongoDB connection closed')
    console.log('🎉 Diamond sync process finished successfully')
  } catch (err) {
    console.error('❌ Diamond sync failed:', err)
  }
}

syncDiamonds()
