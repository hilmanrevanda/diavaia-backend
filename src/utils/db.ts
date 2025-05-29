import { MongoClient } from 'mongodb'

let client: MongoClient

export async function getClient() {
  if (!client) {
    client = new MongoClient(process.env.DATABASE_URI!)
    await client.connect()
  }
  return client
}
