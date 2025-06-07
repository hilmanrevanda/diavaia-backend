import { Pool } from 'pg'
import { POSTGRES_URL } from './config'

const pool = new Pool({
  connectionString: POSTGRES_URL,
})

// Ganti 'diamonds' dengan nama tabel kamu di PostgreSQL
const TABLE_NAME = 'natural_colored_diamonds'

/**
 * Ambil semua diamond_id dari database
 */
export async function getAllProductIDs(): Promise<Set<string>> {
  const client = await pool.connect()
  try {
    const res = await client.query(`SELECT diamond_id FROM ${TABLE_NAME}`)
    const ids = new Set(res.rows.map((row) => row.diamond_id as string))
    return ids
  } finally {
    client.release()
  }
}

/**
 * Hapus produk berdasarkan diamond_id
 */
export async function deleteProductById(diamondId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(`DELETE FROM ${TABLE_NAME} WHERE diamond_id = $1`, [diamondId])
  } finally {
    client.release()
  }
}

export async function deleteProductsNotInList(existingIds: Set<string>): Promise<void> {
  const client = await pool.connect()
  try {
    const placeholders = Array.from(existingIds)
      .map((_, i) => `$${i + 1}`)
      .join(',')
    await client.query(
      `DELETE FROM ${TABLE_NAME} WHERE diamond_id NOT IN (${placeholders})`,
      Array.from(existingIds),
    )
  } finally {
    client.release()
  }
}
