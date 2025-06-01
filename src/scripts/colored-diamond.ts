/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient } from '@/utils/db'
import { Client } from 'basic-ftp'
import { parse } from 'csv-parse'
import { PassThrough } from 'stream'

export async function syncColoredDiamonds() {
  console.log('💎 Sync colored diamond...')
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
    const collection = db.collection('natural-colored-diamonds')

    const BATCH_SIZE = 1000
    let buffer: any[] = []
    let totalCount = 0

    const parser = stream
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', async (row) => {
        buffer.push({
          updateOne: {
            filter: { diamond_id: row.diamond_id },
            update: {
              $set: row,
            },
            upsert: true,
          },
        })

        if (buffer.length >= BATCH_SIZE) {
          parser.pause()
          const result = await collection.bulkWrite(buffer)
          console.log(`✅ Inserted colored diamond batch: ${result.modifiedCount} modified`)
          totalCount += buffer.length
          buffer = []
          parser.resume()
        }
      })
      .on('end', async () => {
        if (buffer.length > 0) {
          const result = await collection.bulkWrite(buffer)
          totalCount += buffer.length
          console.log(`✅ Final colored diamond batch: ${result.modifiedCount} modified`)
        }
        console.log(`🎉 Total ${totalCount} colored diamond records synced.`)
      })
      .on('error', async (err) => {
        console.error('❌ Parsing error:', err)
      })

    await ftp.downloadTo(stream, 'natural-fancy-7.csv')
  } catch (err) {
    console.error('❌ FTP Error:', err)
    throw err
  } finally {
    ftp.close()
    console.log('🔌 FTP connection closed')
  }
}
