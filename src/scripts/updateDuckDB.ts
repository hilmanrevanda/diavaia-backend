import { DuckDBInstance } from '@duckdb/node-api'

export async function updateDuckDBFromPostgres(table: string) {
  const instance = await DuckDBInstance.create('./data.duckdb')
  const conn = await instance.connect()

  try {
    // Bersihkan tabel
    await conn.run(`DELETE FROM ${table}`)

    // Sinkronisasi ulang dari Postgres
    await conn.run(`
      INSERT INTO ${table}
      SELECT * FROM postgres_read('${process.env.DATABASE_URI}', 'public.${table}')
    `)

    console.log('📊 DuckDB updated from PostgreSQL.')
  } finally {
    // Tutup koneksi
    conn.closeSync() // atau conn.disconnectSync()
  }
}
