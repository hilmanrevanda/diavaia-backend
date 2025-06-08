import duckdb from 'duckdb'

export async function updateDuckDBFromPostgres(table: string) {
  const db = new duckdb.Database('./data.duckdb')

  await db.run(`DELETE FROM ${table}`)

  await db.run(`
    INSERT INTO ${table}
    SELECT * FROM postgres_read('${process.env.DATABASE_URI!}', 'public.${table}')
  `)

  console.log('📊 DuckDB updated from PostgreSQL.')
}
