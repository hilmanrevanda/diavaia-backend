import cron from 'node-cron'
import { syncFromFtp } from './syncFromFtp'

cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running hourly sync from FTP...')
  await syncFromFtp()
})
