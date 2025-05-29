/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from 'csv-parse'
import { Client } from 'basic-ftp'
import { PassThrough } from 'stream'

export async function syncFromFtp(filename: string) {
  console.log('⚙️ Mulai syncFromFtp()')
  const client = new Client(0)
  client.ftp.verbose = false

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: Number(process.env.FTP_PORT) || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    })

    console.log('📡 Connected to FTP')

    const stream = new PassThrough()
    const results: any[] = []

    // Mulai download ke stream
    const downloadPromise = client.downloadTo(stream, filename)

    // Sementara itu, langsung mulai parse stream
    const parsePromise = new Promise<void>((resolve, reject) => {
      stream
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          results.push(row)
        })
        .on('end', () => {
          console.log(`📦 Finished parsing CSV with ${results.length} rows.`)
          resolve()
        })
        .on('error', (err) => {
          console.error('❌ CSV parse error:', err)
          reject(err)
        })
    })

    await Promise.all([downloadPromise, parsePromise])
    return results
  } catch (err) {
    console.error('❌ FTP Sync error:', err)
    throw err
  } finally {
    client.close()
    console.log('🔌 FTP connection closed')
  }
}
