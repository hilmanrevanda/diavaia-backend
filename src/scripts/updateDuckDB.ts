import duckdb from 'duckdb'

export async function updateDuckDBFromPostgres() {
  const db = new duckdb.Database('./data.duckdb')

  await db.run(`DELETE FROM diamonds`)

  await db.run(`
    INSERT INTO diamonds
    SELECT * FROM postgres_read('postgresql://user:pass@localhost/dbname', 'public.diamonds')
  `)

  console.log('📊 DuckDB updated from PostgreSQL.')
}
