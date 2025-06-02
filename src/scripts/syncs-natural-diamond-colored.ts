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
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/4f81b734-1d57-4f8c-ac6f-64bef4afc3cb'
const FILE_DIR = join(process.cwd(), 'data')
const FILE_A_PATH = join(FILE_DIR, 'natural-diamond-colored.csv')
const MONGO_URI = process.env.DATABASE_URI!
const COLLECTION_NAME = 'natural-colored-diamonds'

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

async function streamAndUpsertCSV(
  filePath: string,
  collection: any,
  skipIds: Set<string>,
): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    const validIds = new Set<string>()
    const bulkOps: any[] = []
    let lineNumber = 0
    let processing = 0 // track operasi async yang sedang berjalan
    let streamEnded = false
    let errorOccurred = false

    const BATCH_SIZE = 500

    const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 }).pipe(csv())

    function flushBulkOps() {
      if (bulkOps.length === 0) return Promise.resolve()
      const opsToExecute = bulkOps.splice(0, bulkOps.length)
      processing++
      return collection.bulkWrite(opsToExecute, { ordered: false }).finally(() => {
        processing--
        if (streamEnded && processing === 0) {
          resolve(validIds)
        }
      })
    }

    stream.on('data', (row) => {
      stream.pause() // pause stream supaya tidak overload memori

      lineNumber++
      try {
        if (!row.diamond_id || skipIds.has(row.diamond_id)) {
          stream.resume()
          return
        }

        const size = JSON.stringify(row).length
        if (size > 50000) {
          console.warn(`⚠️ Skipping large row at line ${lineNumber} (${size} bytes)`)
          stream.resume()
          return
        }

        validIds.add(row.diamond_id)

        bulkOps.push({
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

        if (bulkOps.length >= BATCH_SIZE) {
          flushBulkOps().catch((err: any) => {
            errorOccurred = true
            stream.destroy(err)
          })
        }
      } catch (err: any) {
        console.error(`❌ Error processing line ${lineNumber}:`, err.message)
      } finally {
        if (!errorOccurred) stream.resume()
      }
    })

    stream.on('end', () => {
      streamEnded = true
      flushBulkOps()
        .catch((err: any) => {
          errorOccurred = true
          reject(err)
        })
        .finally(() => {
          if (processing === 0 && !errorOccurred) {
            resolve(validIds)
          }
        })
    })

    stream.on('error', (err) => {
      errorOccurred = true
      reject(err)
    })
  })
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

  console.log(`🧹 Deleted outdated items`)
}

export async function syncsColoredDiamond() {
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
