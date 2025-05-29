/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient } from '@/utils/db'
import { syncFromFtp } from '@/utils/syncFromFtp'

export async function syncDiamonds() {
  console.log('💎 Sync diamond...')

  const products = await syncFromFtp('Diavaia Inc._natural.csv')
  const client = await getClient()
  const db = client.db()
  const collection = db.collection('diamonds')

  const batchSize = 1000
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    const operations = batch.map((product: any) => ({
      updateOne: {
        filter: { stock_id: product.stock_id },
        update: { $set: product },
        upsert: true,
      },
    }))

    const result = await collection.bulkWrite(operations)
    console.log(`✅ Diamond Batch ${i / batchSize + 1}: ${result.modifiedCount} modified`)
  }
  await client.close()
}
