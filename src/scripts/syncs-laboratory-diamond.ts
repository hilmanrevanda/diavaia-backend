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
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/f1bb4b3c-e938-408a-8a2d-0a67c19cf0c4'
const FILE_B_URL =
  'https://gateway.nivodaapi.net/feeds-api/ftpdownload/12042853-d999-4793-9cc5-d6fda64e3ad3'
const FILE_DIR = join(process.cwd(), 'data')
const FILE_A_PATH = join(FILE_DIR, 'laboratory-diamond-diavaia.csv')
const FILE_B_PATH = join(FILE_DIR, 'laboratory-diamond.csv')
const MONGO_URI = process.env.DATABASE_URI!
const COLLECTION_NAME = 'laboratory-grown-diamonds'

mkdirSync(FILE_DIR, { recursive: true })

async function downloadFile(url: string, localPath: string): Promise<boolean> {
  const tempPath = join(tmpdir(), `temp-${Date.now()}-${Math.random()}`)
  try {
    console.log(`🌐 Downloading from ${url}`)
    const response = await axios({
      url,
      responseType: 'stream',
      timeout: 300000,
      // maxContentLength: Infinity,
      // maxBodyLength: Infinity,
    })
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

    const stream = createReadStream(filePath, { highWaterMark: 64 * 1024 })
      .pipe(csv())
      .on('data', async (row) => {
        lineNumber++

        try {
          if (!row.diamond_id || skipIds.has(row.diamond_id)) return

          const size = JSON.stringify(row).length
          if (size > 50000) {
            console.warn(`⚠️ Skipping large row at line ${lineNumber} (${size} bytes)`)
            return
          }

          validIds.add(row.diamond_id)

          bulkOps.push({
            updateOne: {
              filter: { diamond_id: row.diamond_id },
              update: {
                $set: {
                  ...row,
                  published: true,
                  is_diavaia: true,
                },
              },
              upsert: true,
            },
          })

          if (bulkOps.length >= 500) {
            stream.pause()
            await collection.bulkWrite(bulkOps)
            bulkOps.length = 0
            stream.resume()
          }
        } catch (err: any) {
          console.error(`❌ Error processing line ${lineNumber}:`, err.message)
        }
      })
      .on('end', async () => {
        if (bulkOps.length > 0) {
          await collection.bulkWrite(bulkOps)
        }
        console.log(`✅ Finished processing: ${filePath}, total ${validIds.size} items`)
        resolve(validIds)
      })
      .on('error', (err) => {
        console.error(`❌ CSV stream error on ${filePath}:`, err.message)
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

    // Batas aman
    if (idsToDelete.length >= 1000) {
      await collection.deleteMany({ diamond_id: { $in: idsToDelete } })
      idsToDelete.length = 0
    }
  }

  // Sisa terakhir
  if (idsToDelete.length > 0) {
    await collection.deleteMany({ diamond_id: { $in: idsToDelete } })
  }

  console.log(`🧹 Deleted outdated items`)
}

export async function syncsLaboratoryDiamond() {
  const mongo = new MongoClient(MONGO_URI)
  await mongo.connect()
  const db = mongo.db()
  const collection = db.collection(COLLECTION_NAME)

  try {
    const aReady = await downloadFile(FILE_A_URL, FILE_A_PATH)
    const bReady = await downloadFile(FILE_B_URL, FILE_B_PATH)

    if (!aReady || !bReady) {
      throw new Error('Missing one or both files')
    }

    console.log('⏳ Syncing FILE_A')
    const fileAIds = await streamAndUpsertCSV(FILE_A_PATH, collection, new Set())

    console.log('⏳ Syncing FILE_B')
    const fileBIds = await streamAndUpsertCSV(FILE_B_PATH, collection, fileAIds)

    const allValidIds = new Set([...fileAIds, ...fileBIds])

    console.log('🧹 Deleting outdated items...')
    await deleteMissing(collection, allValidIds)
  } catch (err: any) {
    console.error('❌ Sync failed:', err.message)
  } finally {
    await mongo.close()
    console.log('🔌 MongoDB connection closed')
  }
}
