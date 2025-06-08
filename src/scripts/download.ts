/* eslint-disable @typescript-eslint/no-explicit-any */
import https from 'https'
import fs from 'fs'

export async function downloadCSVWithTimeout(
  CSV_PATH: any,
  CSV_URL: any,
  DATA_DIR: any,
  timeoutMs = 60000,
  maxRetries = 3,
  delayMs = 3000,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📥 Attempt ${attempt} to download CSV...`)

    const result = await new Promise<boolean>((resolve) => {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

      const file = fs.createWriteStream(CSV_PATH)
      const request = https.get(CSV_URL, (res) => {
        if (res.statusCode !== 200) {
          console.error(`❌ Failed to download CSV: HTTP ${res.statusCode}`)
          file.close()
          if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH)
          return resolve(false)
        }

        const totalSize = parseInt(res.headers['content-length'] || '0', 10)
        let downloaded = 0
        let lastLogged = Date.now()

        res.on('data', (chunk) => {
          downloaded += chunk.length
          const now = Date.now()
          if (now - lastLogged >= 1000 || downloaded === totalSize) {
            const percent = totalSize ? ((downloaded / totalSize) * 100).toFixed(2) : 'Unknown'
            const mb = (downloaded / 1024 / 1024).toFixed(2)
            const totalMb = totalSize ? (totalSize / 1024 / 1024).toFixed(2) : 'Unknown'
            process.stdout.write(`📊 Downloaded ${mb} MB of ${totalMb} MB (${percent}%)\r`)
            lastLogged = now
          }
        })

        res.pipe(file)

        file.on('finish', () => {
          file.close(() => {
            // Tunggu sampai file benar-benar tersedia
            if (fs.existsSync(CSV_PATH)) {
              console.log('\n✅ CSV downloaded successfully.')
              resolve(true)
            } else {
              console.error('\n❌ File not found after download finished.')
              resolve(false)
            }
          })
        })
      })

      request.setTimeout(timeoutMs, () => {
        console.error('\n⏰ Timeout during CSV download.')
        request.destroy()
        if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH)
        resolve(false)
      })

      request.on('error', (err) => {
        console.error('\n❌ CSV download error:', err.message)
        if (fs.existsSync(CSV_PATH)) fs.unlinkSync(CSV_PATH)
        resolve(false)
      })
    })

    if (result) return true
    if (attempt < maxRetries) {
      console.log(`🔁 Retrying download in ${delayMs / 1000}s...\n`)
      await new Promise((res) => setTimeout(res, delayMs))
    }
  }

  console.error('❌ Failed to download CSV after maximum retries.')
  return false
}
