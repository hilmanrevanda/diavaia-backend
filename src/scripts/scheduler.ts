import { syncDiamonds } from './diamond'

async function main() {
  let exitCode = 0

  try {
    console.log('🚀 Mulai sync semua produk...')
    await syncDiamonds()
    console.log('🎉 Selesai sync semua produk!')
  } catch (err) {
    console.error('❌ Error sync:', err)
    exitCode = 1
  } finally {
    process.exit(exitCode)
  }
}

main()
