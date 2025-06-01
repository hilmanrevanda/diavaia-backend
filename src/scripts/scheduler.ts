import { syncsDiamond } from './syncs-diamond'
import { syncsLaboratoryColoredDiamond } from './syncs-laboratory-colored'
import { syncsLaboratoryDiamond } from './syncs-laboratory-diamond'
import { syncsColoredDiamond } from './syncs-natural-diamond-colored'

async function main() {
  let exitCode = 0

  try {
    console.log('🚀 Start syncs all products...')
    await syncsDiamond()
    await syncsLaboratoryDiamond()
    await syncsColoredDiamond()
    await syncsLaboratoryColoredDiamond()
    console.log('🎉 Finished sycns all products!')
  } catch (err) {
    console.error('❌ Error sync:', err)
    exitCode = 1
  } finally {
    process.exit(exitCode)
  }
}

main()
