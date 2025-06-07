import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql`ALTER TABLE natural_colored_diamonds ADD CONSTRAINT unique_diamond_id UNIQUE (diamond_id);`,
  )
}
