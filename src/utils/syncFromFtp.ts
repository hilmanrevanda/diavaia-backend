/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { Client } from 'basic-ftp'

export async function syncFromFtp() {
  console.log('⚙️ Mulai syncFromFtp()')
  const client = new Client(0)
  client.ftp.verbose = false

  const localPath = path.resolve(__dirname, 'downloaded.csv')

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: Number(process.env.FTP_PORT) || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    })

    console.log('📡 Connected to FTP')

    await client.downloadTo(localPath, process.env.FTP_FILE!)
    console.log('✅ File downloaded from FTP.')

    const results: any[] = []

    await new Promise((resolve, reject) => {
      fs.createReadStream(localPath)
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          results.push(row)
        })
        .on('end', () => {
          console.log(`📦 Finished parsing CSV with ${results.length} rows.`)
          resolve(null)
        })
        .on('error', (err) => {
          console.error('❌ CSV parse error:', err)
          reject(err)
        })
    })

    return results
  } catch (err) {
    console.error('❌ FTP Sync error:', err)
    throw err
  } finally {
    client.close()
    console.log('🔌 FTP connection closed')
  }
}
