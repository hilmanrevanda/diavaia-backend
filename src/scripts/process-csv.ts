/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient } from '@/utils/db'
import { Client } from 'basic-ftp'
import { parse } from 'csv-parse'
import { PassThrough } from 'stream'
import { transform } from 'stream-transform'
import redis from './redis'

const BATCH_SIZE = 1000

export async function processCSVfromFTP({
  filePath,
  redisSetKey,
  checkRedisDuplication = false,
  collectionName,
}: {
  filePath: string
  redisSetKey: string
  checkRedisDuplication?: boolean
  collectionName: string
}) {
  const ftp = new Client(0)
  ftp.ftp.verbose = false
  const stream = new PassThrough()

  const client = await getClient()
  const db = client.db()
  const collection = db.collection(collectionName)

  let buffer: any[] = []
  let totalCount = 0

  const parser = parse({ columns: true, skip_empty_lines: true })

  const transformer = transform({ parallel: 10 }, async (row: any, callback: any) => {
    try {
      const diamondId = row.diamond_id
      if (!diamondId) return callback()

      if (checkRedisDuplication) {
        const isDup = await redis.sIsMember(redisSetKey, diamondId)
        if (isDup) return callback()
      }

      await redis.sAdd(redisSetKey, diamondId)

      buffer.push({
        updateOne: {
          filter: { diamond_id: diamondId },
          update: {
            $set: {
              stock_id: row.stock_id,
              diamond_id: diamondId,
              report_no: row?.ReportNo,
              shape: row?.shape,
              full_shape: row?.fullShape,
              carats: parseFloat(row?.carats || 0),
              col: row?.col,
              clar: row?.clar,
              cut: row?.cut,
              pol: row?.pol,
              symm: row?.symm,
              flo: row?.flo,
              flo_col: row?.floCol,
              eye_clean: row?.eyeClean,
              brown: row?.brown,
              green: row?.green,
              milky: row?.milky,
              fancy_color: row?.fancyColor,
              fancy_overtone: row?.fancyOvertone,
              fancy_intensity: row?.fancyIntensity,
              color_shade: row?.colorShade,
              length: parseFloat(row?.length || 0),
              width: parseFloat(row?.width || 0),
              height: parseFloat(row?.height || 0),
              depth: parseFloat(row?.depth || 0),
              table: parseFloat(row?.table || 0),
              culet: row?.culet,
              girdle: row?.girdle,
              star_length: parseFloat(row?.starLength || 0),
              lower_girdle: parseFloat(row?.lowerGirdle || 0),
              crown_height: parseFloat(row?.crownHeight || 0),
              crown_angle: parseFloat(row?.crownAngle || 0),
              pav_angle: parseFloat(row?.pavAngle || 0),
              pav_height: parseFloat(row?.pavHeight || 0),
              pav_depth: parseFloat(row?.pavDepth || 0),
              discount: row?.discount,
              price: parseFloat(row?.price || 0),
              markup_price: parseFloat(row?.markup_price || 0),
              markup_currency: row?.markup_currency,
              price_per_carat: parseFloat(row?.price_per_carat || 0),
              delivered_price: parseFloat(row?.deliveredPrice || 0),
              lab: row?.lab,
              pdf: row?.pdf,
              video: row?.video,
              image: row?.image,
              videos_image_uri: row?.videosImageUri,
              videos_frame: parseFloat(row?.videosFrame || 0),
              blue: row?.blue,
              gray: row?.gray,
              min_delivery_days: parseInt(row?.minDeliveryDays || 0),
              max_delivery_days: parseInt(row?.maxDeliveryDays || 0),
              country: row?.country,
              mine_of_origin: row?.mine_of_origin,
              canada_mark_eligible: row?.canada_mark_eligible === 'TRUE',
              labgrown_type: row?.labgrownType,
              lg: row?.lg,
              is_returnable: row?.is_returnable === 'Y',
              published: true,
              is_diavaia: true,
            },
          },
          upsert: true,
        },
      })

      if (buffer.length >= BATCH_SIZE) {
        await collection.bulkWrite(buffer)
        totalCount += buffer.length
        buffer = []
      }

      callback()
    } catch (err) {
      console.error('❌ Transform error:', err)
      callback(err)
    }
  })

  transformer.on('finish', async () => {
    if (buffer.length > 0) {
      await collection.bulkWrite(buffer)
      totalCount += buffer.length
    }
    console.log(`🎉 [${filePath}] Synced ${totalCount} records.`)
  })

  transformer.on('error', (err) => {
    console.error('❌ Transformer error:', err)
  })

  stream.pipe(parser).pipe(transformer)

  try {
    await ftp.access({
      host: process.env.FTP_HOST,
      port: Number(process.env.FTP_PORT) || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    })
    console.log(`📡 Downloading ${filePath} from FTP...`)
    await ftp.downloadTo(stream, filePath)
  } finally {
    ftp.close()
  }
}
