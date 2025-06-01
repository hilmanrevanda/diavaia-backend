// import { syncColoredDiamonds } from './colored-diamond'
import { syncsDiamond } from './syncs-diamond'
import { syncsLaboratoryDiamond } from './syncs-laboratory-diamond'
// import { syncDiamondsTwo } from './diamond-2'
// import { syncGrownDiamonds } from './grown-diamond'
// import { syncGrownDiamondsTwo } from './grown-diamond-2'
// import { syncLabGrownColoredDiamonds } from './lab-grown-colored-diamonds'

async function main() {
  let exitCode = 0

  try {
    console.log('🚀 Mulai sync semua produk...')
    // await syncDiamonds()
    // await syncDiamondsTwo()
    // await syncColoredDiamonds()
    // await syncLabGrownColoredDiamonds()
    // await syncGrownDiamonds()
    // await syncGrownDiamondsTwo()
    // await syncAllDiamonds()
    // await syncsDiamond()
    await syncsLaboratoryDiamond()
    console.log('🎉 Selesai sync semua produk!')
  } catch (err) {
    console.error('❌ Error sync:', err)
    exitCode = 1
  } finally {
    process.exit(exitCode)
  }
}

main()
