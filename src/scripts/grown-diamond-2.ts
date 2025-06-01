/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient } from '@/utils/db'
import { Client } from 'basic-ftp'
import { parse } from 'csv-parse'
import { PassThrough } from 'stream'
import { transform } from 'stream-transform'
import redis from './redis'

export async function syncGrownDiamondsTwo() {
  console.log('💎 Sync grown diamond...')
  const ftp = new Client(0)
  ftp.ftp.verbose = false
  const stream = new PassThrough()

  let client: Awaited<ReturnType<typeof getClient>> | null = null

  try {
    await ftp.access({
      host: process.env.FTP_HOST,
      port: Number(process.env.FTP_PORT) || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    })

    console.log('📡 Connected to FTP')

    client = await getClient()
    const db = client.db()
    const collection = db.collection('laboratory-grown-diamonds')

    const BATCH_SIZE = 1000
    let buffer: any[] = []
    let totalCount = 0

    const parser = parse({ columns: true, skip_empty_lines: true })

    const transformer = transform({ parallel: 10 }, async (row: any, callback: any) => {
      try {
        const skip = await redis.sIsMember('skip_labs_diamond_ids', row.diamond_id)
        if (skip) return callback()

        await redis.sAdd('skip_labs_diamond_ids', row.diamond_id)

        buffer.push({
          updateOne: {
            filter: { diamond_id: row.diamond_id },
            update: {
              $set: {
                ...row,
                is_diavaia: false,
              },
            },
            upsert: true,
          },
        })

        if (buffer.length >= BATCH_SIZE) {
          await collection.bulkWrite(buffer)
          totalCount += buffer.length
          console.log(`✅ Inserted grown diamond batch of ${buffer.length}`)
          buffer = []
        }

        callback()
      } catch (err) {
        console.error('❌ Transform error:', err)
        callback(err)
      }
    })

    transformer.on('finish', async () => {
      if (buffer.length > 0) {
        const result = await collection.bulkWrite(buffer)
        totalCount += buffer.length
        console.log(`✅ Final grown diamond batch: ${result.modifiedCount} modified`)
      }
      console.log(`🎉 Total ${totalCount} grown diamond records synced.`)
    })

    await redis.del('skip_labs_diamond_ids')
    console.log(`🧹 Redis cache 'skip_labs_diamond_ids' cleared.`)

    transformer.on('error', (err) => {
      console.error('❌ Transformer error:', err)
    })

    stream.pipe(parser).pipe(transformer)

    await ftp.downloadTo(stream, 'labgrown-white-4.csv')
  } catch (err) {
    console.error('❌ FTP Error:', err)
    throw err
  } finally {
    ftp.close()
    console.log('🔌 FTP connection closed')
  }
}
