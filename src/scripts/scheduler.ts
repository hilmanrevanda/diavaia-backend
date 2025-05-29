import { syncDiamonds } from './diamond'

async function main() {
  console.log('🚀 Mulai sync semua produk...')
  await syncDiamonds()
  console.log('🎉 Selesai sync semua produk!')
}

main().catch((err) => {
  console.error('❌ Error sync:', err)
  process.exit(1)
})
