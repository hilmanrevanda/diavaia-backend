import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { Client } from 'basic-ftp'

export async function syncFromFtp() {
  console.log('⚙️ Mulai syncFromFtp()')
  const client = new Client()
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

    const csv = fs.readFileSync(localPath)
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
    })

    console.log(`📦 Found ${records.length} products`)

    return records
  } catch (err) {
    console.error('❌ FTP Sync error:', err)
    throw err // 💥 Penting: lempar error agar fetch tahu ini gagal
  } finally {
    client.close()
    console.log('🔌 FTP connection closed')
  }
}
