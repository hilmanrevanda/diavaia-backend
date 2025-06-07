/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import csv from 'csv-parser'
import { Pool } from 'pg'
import { CSV_PATH } from './config'

// Setup PostgreSQL connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'zuanda',
  password: 'abgamijuan21',
  database: 'diavaia',
})

export async function parseAndInsertToPostgres(): Promise<void> {
  const batchSize = 500
  const buffer: any[] = []

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', async (row) => {
        const doc = {
          diamond_id: row.diamond_id,
          stock_id: row.stock_id,
          report_no: row.ReportNo,
          shape: row.shape,
          full_shape: row.fullShape,
          carats: parseFloat(row.carats || '0'),
          col: row.col,
          clar: row.clar,
          cut: row.cut,
          pol: row.pol,
          symm: row.symm,
          flo: row.flo,
          flo_col: row.floCol,
          eye_clean: row.eyeClean,
          brown: row.brown,
          green: row.green,
          milky: row.milky,
          fancy_color: row.fancyColor,
          fancy_overtone: row.fancyOvertone,
          fancy_intensity: row.fancyIntensity,
          color_shade: row.colorShade,
          length: parseFloat(row.length || '0'),
          width: parseFloat(row.width || '0'),
          height: parseFloat(row.height || '0'),
          depth: parseFloat(row.depth || '0'),
          table: parseFloat(row.table || '0'),
          culet: row.culet,
          girdle: row.girdle,
          star_length: parseFloat(row.starLength || '0'),
          lower_girdle: parseFloat(row.lowerGirdle || '0'),
          crown_height: parseFloat(row.crownHeight || '0'),
          crown_angle: parseFloat(row.crownAngle || '0'),
          pav_angle: parseFloat(row.pavAngle || '0'),
          pav_height: parseFloat(row.pavHeight || '0'),
          pav_depth: parseFloat(row.pavDepth || '0'),
          discount: row.discount,
          price: parseFloat(row.price || '0'),
          markup_price: parseFloat(row.markup_price || '0'),
          markup_currency: row.markup_currency,
          price_per_carat: parseFloat(row.price_per_carat || '0'),
          delivered_price: parseFloat(row.deliveredPrice || '0'),
          lab: row.lab,
          pdf: row.pdf,
          video: row.video,
          image: row.image,
          videos_image_uri: row.videosImageUri,
          videos_frame: parseFloat(row.videosFrame || '0'),
          blue: row.blue,
          gray: row.gray,
          min_delivery_days: parseInt(row.minDeliveryDays || '0'),
          max_delivery_days: parseInt(row.maxDeliveryDays || '0'),
          country: row.country,
          mine_of_origin: row.mine_of_origin,
          canada_mark_eligible: row.canada_mark_eligible === 'TRUE',
          labgrown_type: row.labgrownType,
          lg: row.lg,
          is_returnable: row.is_returnable === 'Y',
          is_diavaia: true,
          published: true,
        }

        buffer.push(doc)

        if (buffer.length >= batchSize) {
          await insertBatch(buffer.splice(0, batchSize))
        }
      })
      .on('end', async () => {
        if (buffer.length > 0) {
          await insertBatch(buffer)
        }
        console.log('✅ Done inserting CSV to PostgreSQL.')
        resolve()
      })
      .on('error', (err) => {
        console.error('❌ CSV Error:', err)
        reject(err)
      })
  })
}

async function insertBatch(batch: any[]) {
  const client = await pool.connect()
  try {
    const fields = Object.keys(batch[0])
    const escapedFields = fields.map((f) => `"${f}"`) // Escape dengan double quotes

    const values = batch.map(Object.values)

    const query = `
      INSERT INTO natural_colored_diamonds (${escapedFields.join(',')})
      VALUES ${values
        .map((row, i) => `(${row.map((_, j) => `$${i * row.length + j + 1}`).join(',')})`)
        .join(',')}
      ON CONFLICT (diamond_id) DO NOTHING
    `

    const flatValues = values.flat()
    await client.query(query, flatValues)
  } catch (err: any) {
    console.error('❌ Insert batch error:', err.message)
  } finally {
    client.release()
  }
}
