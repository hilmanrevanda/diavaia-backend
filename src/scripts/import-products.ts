import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { parse } from 'csv-parse/sync'
import { getPayload } from 'payload'
import config from '@payload-config'
import { fileURLToPath } from 'url'

dotenv.config()

async function importProducts() {
  const payload = await getPayload({ config })
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const csvPath = path.resolve(__dirname, 'products.csv')
  const csvData = fs.readFileSync(csvPath, 'utf-8')

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  })

  const created = []

  for (const record of records) {
    try {
      const result = await payload.create({
        collection: 'products',
        data: {
          stock_id: record.stock_id,
          report_no: record?.ReportNo,
          shape: record?.shape,
          full_shape: record?.fullShape,
          carats: parseFloat(record?.carats || 0),
          col: record?.col,
          clar: record?.clar,
          cut: record?.cut,
          pol: record?.pol,
          symm: record?.symm,
          flo: record?.flo,
          flo_col: record?.floCol,
          eye_clean: record?.eyeClean,
          brown: record?.brown,
          green: record?.green,
          milky: record?.milky,
          fancy_color: record?.fancyColor,
          fancy_overtone: record?.fancyOvertone,
          fancy_intensity: record?.fancyIntensity,
          color_shade: record?.colorShade,
          length: parseFloat(record?.length || 0),
          width: parseFloat(record?.width || 0),
          height: parseFloat(record?.height || 0),
          depth: parseFloat(record?.depth || 0),
          table: parseFloat(record?.table || 0),
          culet: record?.culet,
          girdle: record?.girdle,
          star_length: parseFloat(record?.starLength || 0),
          lower_girdle: parseFloat(record?.lowerGirdle || 0),
          crown_height: parseFloat(record?.crownHeight || 0),
          crown_angle: parseFloat(record?.crownAngle || 0),
          pav_angle: parseFloat(record?.pavAngle || 0),
          pav_height: parseFloat(record?.pavHeight || 0),
          pav_depth: parseFloat(record?.pavDepth || 0),
          discount: record?.discount,
          price: parseFloat(record?.price || 0),
          markup_price: parseFloat(record?.markup_price || 0),
          markup_currency: record?.markup_currency,
          price_per_carat: parseFloat(record?.price_per_carat || 0),
          delivered_price: parseFloat(record?.deliveredPrice || 0),
          lab: record?.lab,
          pdf: record?.pdf,
          video: record?.video,
          image: record?.image,
          videos_image_uri: record?.videosImageUri,
          videos_frame: parseFloat(record?.videosFrame || 0),
          blue: record?.blue,
          gray: record?.gray,
          min_delivery_days: parseInt(record?.minDeliveryDays || 0),
          max_delivery_days: parseInt(record?.maxDeliveryDays || 0),
          country: record?.country,
          mine_of_origin: record?.mine_of_origin,
          canada_mark_eligible: record?.canada_mark_eligible === 'TRUE',
          labgrown_type: record?.labgrownType,
          lg: record?.lg,
          is_returnable: record?.is_returnable === 'Y',
          published: false,
        },
      })
      created.push(result)
    } catch (error) {
      console.error('Failed to import row:', record, error)
    }
  }

  process.exit(0)
}

importProducts()
