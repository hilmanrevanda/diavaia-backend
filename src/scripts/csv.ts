/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import path from 'path'
import readline from 'readline'

export async function parseCSVAndWriteIDs(csvPath: string, tempFilePath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at path: ${csvPath}`)
    }

    const dir = path.dirname(tempFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const output = fs.createWriteStream(tempFilePath)
    const rl = readline.createInterface({
      input: fs.createReadStream(csvPath),
      crlfDelay: Infinity,
    })

    let diamondIdIndex = -1
    let lineCount = 0
    let savedCount = 0

    for await (const line of rl) {
      const columns = line.split(',')

      if (lineCount === 0) {
        // Baris header
        diamondIdIndex = columns.findIndex((col) => col.trim().toLowerCase() === 'diamond_id')
        if (diamondIdIndex === -1) {
          throw new Error('diamond_id column not found in CSV header')
        }
      } else {
        const id = columns[diamondIdIndex]?.trim()
        if (id) {
          output.write(id + '\n')
          savedCount++
        }
      }
      lineCount++
    }

    output.end()
    await new Promise((res: any) => output.on('finish', res))

    console.log(`✅ Parsed CSV and saved ${savedCount} diamond_ids.`)
    return true
  } catch (err) {
    console.error('❌ Error parsing CSV or writing temp file:', err)
    return false
  }
}
