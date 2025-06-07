/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import path from 'path'
import https from 'https'
import csvParser from 'csv-parser'
import { MongoClient } from 'mongodb'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, 'data')

const CSV_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/12042853-d999-4793-9cc5-d6fda64e3ad3'
const CSV_PATH = path.resolve(DATA_DIR, 'latest-laboratory-diamond.csv')
const VALID_IDS_PATH = path.resolve(DATA_DIR, 'valid-laboratory-ids.json')
const EXISTING_IDS_PATH = path.resolve(DATA_DIR, 'existing-laboratory-ids.json')

const MONGO_URI = process.env.DATABASE_URI!
const COLLECTION_NAME = 'laboratory-grown-diamonds'

function downloadLatestCSV(): Promise<boolean> {
  console.log('📥 Starting CSV download...')
  return new Promise((resolve) => {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    const file = fs.createWriteStream(CSV_PATH)
    const req = https.get(CSV_URL, (res) => {
      if (res.statusCode !== 200) {
        console.error(`❌ Failed to download CSV: HTTP status ${res.statusCode}`)
        file.close()
        if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH)
        resolve(false)
        return
      }

      const totalSize = parseInt(res.headers['content-length'] || '0', 10)
      let downloadedSize = 0
      let lastLogged = Date.now()

      // Timeout jika tidak ada data masuk dalam 30 detik
      let inactivityTimeout = setTimeout(() => {
        console.error('❌ Inactivity timeout: no data received for 30 seconds.')
        req.destroy()
        res.destroy()
        file.close()
        if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH)
        resolve(false)
      }, 30_000)

      res.on('data', (chunk) => {
        clearTimeout(inactivityTimeout) // reset timer setiap data masuk
        inactivityTimeout = setTimeout(() => {
          console.error('❌ Inactivity timeout: no data received for 30 seconds.')
          req.destroy()
          res.destroy()
          file.close()
          if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH)
          resolve(false)
        }, 30_000)

        downloadedSize += chunk.length

        const now = Date.now()
        if (now - lastLogged >= 1000) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(2)
          process.stdout.write(
            `📊 Downloaded: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)\r`,
          )
          lastLogged = now
        }
      })

      res.pipe(file)

      file.on('finish', () => {
        clearTimeout(inactivityTimeout)
        file.close()
        console.log('\n✅ Downloaded latest-feed.csv successfully.')
        resolve(true)
      })
    })

    req.on('error', (err) => {
      console.error('❌ Error downloading CSV:', err.message)
      if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH)
      resolve(false)
    })
  })
}

async function loadValidIdsFromCSV(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const validIds: any[] = []
    fs.createReadStream(CSV_PATH)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.diamond_id) validIds.push(row.diamond_id)
      })
      .on('end', () => {
        fs.writeFileSync(VALID_IDS_PATH, JSON.stringify(validIds, null, 2))
        resolve(validIds)
      })
      .on('error', reject)
  })
}

function loadJsonFile(filePath: string) {
  if (!fs.existsSync(filePath)) return []
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error(`Failed to read ${filePath}:`, e)
    return []
  }
}

function saveJsonFile(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function diffToDelete(existingIds: any[], validIds: any[]) {
  const validSet = new Set(validIds)
  return existingIds.filter((id) => !validSet.has(id))
}

async function deleteObsoleteData(collection: any, idsToDelete: any[]) {
  if (idsToDelete.length === 0) return
  const chunkSize = 1000
  for (let i = 0; i < idsToDelete.length; i += chunkSize) {
    const chunk = idsToDelete.slice(i, i + chunkSize)
    await collection.deleteMany({ diamond_id: { $in: chunk } })
  }
}

async function insertOrUpdateDataFromCSV(collection: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ops: any[] = []
    fs.createReadStream(CSV_PATH)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!row.diamond_id) return
        ops.push({
          updateOne: {
            filter: { diamond_id: row.diamond_id },
            update: {
              $set: {
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
              },
            },
            upsert: true,
          },
        })
        if (ops.length >= 1000) {
          collection.bulkWrite(ops.splice(0)).catch(reject)
        }
      })
      .on('end', async () => {
        if (ops.length > 0) await collection.bulkWrite(ops)
        resolve()
      })
      .on('error', reject)
  })
}

async function downloadWithRetry(retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const success = await downloadLatestCSV()
    if (success) return true

    console.warn(`🔁 Retry ${attempt}/${retries}...`)
    await new Promise((r) => setTimeout(r, 3000))
  }

  console.error('❌ Download gagal setelah beberapa percobaan.')
  return false
}

export async function syncsLaboratoryDiamond() {
  // 1. Download CSV terbaru dulu
  const downloaded = await downloadWithRetry()
  if (!downloaded) {
    console.error('❌ Download gagal, sync dibatalkan.')
    return
  }

  // 2. Connect ke MongoDB dan mulai sync
  const client = new MongoClient(MONGO_URI)
  try {
    await client.connect()
    const db = client.db()
    const collection = db.collection(COLLECTION_NAME)

    console.log('🔄 Loading valid IDs from latest-feed.csv...')
    const validIds: any[] = await loadValidIdsFromCSV()

    console.log('📂 Loading existing IDs...')
    const existingIds = loadJsonFile(EXISTING_IDS_PATH)

    const idsToDelete = diffToDelete(existingIds, validIds)
    console.log(`🧹 Deleting ${idsToDelete.length} obsolete entries...`)
    await deleteObsoleteData(collection, idsToDelete)

    console.log(`⬆️ Inserting/updating ${validIds.length} entries...`)
    await insertOrUpdateDataFromCSV(collection)

    console.log('✅ Updating existing-ids.json...')
    saveJsonFile(EXISTING_IDS_PATH, validIds)

    console.log('🧽 Cleaning up valid-ids.json...')
    if (fs.existsSync(VALID_IDS_PATH)) fs.unlinkSync(VALID_IDS_PATH)

    console.log('🎉 Sync completed successfully.')
  } catch (err) {
    console.error('❌ Sync failed:', err)
  } finally {
    await client.close()
  }
}
