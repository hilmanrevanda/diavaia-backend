import { downloadCSVWithTimeout } from './download'
import { parseAndInsertToPostgres } from './process'
import { deleteRemovedProducts } from './cleanupOldProducts'
import { updateDuckDBFromPostgres } from './updateDuckDB'

export async function syncs() {
  const downloaded = await downloadCSVWithTimeout()
  if (!downloaded) return console.error('❌ Download failed. Sync aborted.')

  try {
    await parseAndInsertToPostgres()
    await deleteRemovedProducts()
    await updateDuckDBFromPostgres()
    console.log('✅ Sync completed successfully.')
  } catch (e) {
    console.error('❌ Sync error:', e)
  }
}
