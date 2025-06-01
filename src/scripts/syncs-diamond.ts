import { getClient } from '@/utils/db'
import redis from './redis'
import { processCSVfromFTP } from './process-csv'

export async function syncAllDiamonds() {
  const redisSetKey = 'diamond_ids:client'
  const tempCollection = 'natural-diamonds-next'
  const oldCollection = 'natural-diamonds'
  const backupCollection = 'natural-diamonds-backup'

  await redis.del(redisSetKey)

  console.log('🔁 Syncing client diamonds...')
  await processCSVfromFTP({
    filePath: 'Diavaia Inc._natural.csv',
    redisSetKey,
    checkRedisDuplication: false,
    collectionName: tempCollection,
  })

  console.log('🔁 Syncing vendor diamonds...')
  await processCSVfromFTP({
    filePath: 'natural-white-3.csv',
    redisSetKey,
    checkRedisDuplication: true,
    collectionName: tempCollection,
  })

  const client = await getClient()
  const db = client.db()

  console.log('🧹 Swapping collections...')
  if (await db.listCollections({ name: backupCollection }).hasNext()) {
    await db.collection(backupCollection).drop()
  }

  if (await db.listCollections({ name: oldCollection }).hasNext()) {
    await db.collection(oldCollection).rename(backupCollection)
  }

  await db.collection(tempCollection).rename(oldCollection)

  console.log('✅ Full diamond sync complete.')
}
