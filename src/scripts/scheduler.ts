import { syncsNaturalDiamonds } from './syncs'
import { syncsLaboratoryColoredDiamond } from './syncs-laboratory-colored'
import { syncsLaboratoryDiamond } from './syncs-laboratory-diamond'
import { syncsNaturalColoredDiamonds } from './syncs-natural-diamond-colored'

async function safeRun(label: string, fn: () => Promise<void>) {
  try {
    console.log(`🚧 Start syncing ${label}...`)
    await fn()
    console.log(`✅ Finished syncing ${label}`)
  } catch (err) {
    console.error(`❌ Failed syncing ${label}:`, err)
  }
}

async function main() {
  console.log('🚀 Start syncing all products...')

  await safeRun('natural diamonds', syncsNaturalDiamonds)
  await safeRun('natural colored diamonds', syncsNaturalColoredDiamonds)
  await safeRun('lab-grown colored diamonds', syncsLaboratoryColoredDiamond)
  await safeRun('lab-grown diamonds', syncsLaboratoryDiamond)

  console.log('🎉 Finished syncing all products (with or without errors)')
}

main()
