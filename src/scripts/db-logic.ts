import { Pool } from 'pg'
import { POSTGRES_URL } from './config'

const pool = new Pool({
  connectionString: POSTGRES_URL,
})

// Ganti 'diamonds' dengan nama tabel kamu di PostgreSQL

/**
 * Ambil semua diamond_id dari database
 */
export async function getAllProductIDs(TABLE_NAME: string): Promise<Set<string>> {
  const client = await pool.connect()
  try {
    const res = await client.query(`SELECT id FROM ${TABLE_NAME}`)
    const ids = new Set(res.rows.map((row) => row.diamond_id as string))
    return ids
  } finally {
    client.release()
  }
}

/**
 * Hapus produk berdasarkan diamond_id
 */
export async function deleteProductById(diamondId: string, TABLE_NAME: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(`DELETE FROM ${TABLE_NAME} WHERE id = $1`, [diamondId])
  } finally {
    client.release()
  }
}

export async function deleteProductsNotInList(
  existingIds: Set<string>,
  TABLE_NAME: string,
): Promise<void> {
  const client = await pool.connect()
  try {
    const placeholders = Array.from(existingIds)
      .map((_, i) => `$${i + 1}`)
      .join(',')
    await client.query(
      `DELETE FROM ${TABLE_NAME} WHERE id NOT IN (${placeholders})`,
      Array.from(existingIds),
    )
  } finally {
    client.release()
  }
}
