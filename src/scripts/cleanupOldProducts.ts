import fs from 'fs'
import readline from 'readline'
import { deleteProductById, getAllProductIDs } from './db-logic'
import { TEMP_ID_PATH } from './config'

export async function deleteRemovedProducts(table: string) {
  const currentIDs = new Set<string>()

  const fileStream = fs.createReadStream(TEMP_ID_PATH)
  const rl = readline.createInterface({ input: fileStream })

  for await (const line of rl) currentIDs.add(line.trim())

  const allDbIds = await getAllProductIDs(table) // ambil semua id dari PostgreSQL

  let deleted = 0
  for (const id of allDbIds) {
    if (!currentIDs.has(id)) {
      await deleteProductById(id, table)
      deleted++
    }
  }

  console.log(`🧹 Deleted ${deleted} old products.`)
}
