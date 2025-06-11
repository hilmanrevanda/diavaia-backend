/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import { parse } from 'fast-csv'
import { Pool } from 'pg'
import { POSTGRES_URL } from './config'

const pool = new Pool({ connectionString: POSTGRES_URL })

type CutwiseMap = Map<string, string>

export async function syncToPostgres(
  csvPath: string,
  table: string,
  cutwiseMap: CutwiseMap,
): Promise<void> {
  console.log('⏳ Syncing CSV to PostgreSQL...')
  const client = await pool.connect()
  const BATCH_SIZE = 500
  const rows: any[] = []

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(parse({ headers: true }))
      .on('error', (error) => {
        console.error('❌ CSV Parse Error:', error)
        reject(error)
      })
      .on('data', (row) => {
        const media = cutwiseMap.get(row.ReportNo?.trim())

        row.aset = media ? 'yes' : 'no'
        row.aset_link = media ?? '-'

        rows.push(row)
        if (rows.length >= BATCH_SIZE) {
          const batch = [...rows]
          rows.length = 0
          insertBatch(batch, client, table).catch(reject)
        }
      })
      .on('end', async () => {
        if (rows.length > 0) await insertBatch(rows, client, table).catch(reject)
        console.log('✅ CSV synced to PostgreSQL.')
        client.release()
        resolve()
      })
  })
}

async function insertBatch(batch: any[], client: any, table: string) {
  if (batch.length === 0) return

  const query = `
    INSERT INTO ${table} (
      id, stock_id, report_no, shape, full_shape, carats,
      col, clar, cut, pol, symm, flo, flo_col, eye_clean,
      brown, green, milky, fancy_color, fancy_overtone, fancy_intensity, color_shade,
      length, width, height, depth, "table", culet, girdle,
      star_length, lower_girdle, crown_height, crown_angle,
      pav_angle, pav_height, pav_depth,
      discount, price, markup_price, markup_currency, price_per_carat, delivered_price,
      lab, pdf, video, image, videos_image_uri, videos_frame,
      blue, gray, min_delivery_days, max_delivery_days,
      country, mine_of_origin, canada_mark_eligible,
      labgrown_type, lg, is_returnable, is_diavaia, published, aset, aset_link
    ) VALUES
    ${batch
      .map(
        (_, i) =>
          `(${Array(61)
            .fill(0)
            .map((_, j) => `$${i * 61 + j + 1}`)
            .join(', ')})`,
      )
      .join(',\n')}
    ON CONFLICT (id) DO UPDATE SET
      stock_id = EXCLUDED.stock_id,
      report_no = EXCLUDED.report_no,
      shape = EXCLUDED.shape,
      full_shape = EXCLUDED.full_shape,
      carats = EXCLUDED.carats,
      col = EXCLUDED.col,
      clar = EXCLUDED.clar,
      cut = EXCLUDED.cut,
      pol = EXCLUDED.pol,
      symm = EXCLUDED.symm,
      flo = EXCLUDED.flo,
      flo_col = EXCLUDED.flo_col,
      eye_clean = EXCLUDED.eye_clean,
      brown = EXCLUDED.brown,
      green = EXCLUDED.green,
      milky = EXCLUDED.milky,
      fancy_color = EXCLUDED.fancy_color,
      fancy_overtone = EXCLUDED.fancy_overtone,
      fancy_intensity = EXCLUDED.fancy_intensity,
      color_shade = EXCLUDED.color_shade,
      length = EXCLUDED.length,
      width = EXCLUDED.width,
      height = EXCLUDED.height,
      depth = EXCLUDED.depth,
      "table" = EXCLUDED."table",
      culet = EXCLUDED.culet,
      girdle = EXCLUDED.girdle,
      star_length = EXCLUDED.star_length,
      lower_girdle = EXCLUDED.lower_girdle,
      crown_height = EXCLUDED.crown_height,
      crown_angle = EXCLUDED.crown_angle,
      pav_angle = EXCLUDED.pav_angle,
      pav_height = EXCLUDED.pav_height,
      pav_depth = EXCLUDED.pav_depth,
      discount = EXCLUDED.discount,
      price = EXCLUDED.price,
      markup_price = EXCLUDED.markup_price,
      markup_currency = EXCLUDED.markup_currency,
      price_per_carat = EXCLUDED.price_per_carat,
      delivered_price = EXCLUDED.delivered_price,
      lab = EXCLUDED.lab,
      pdf = EXCLUDED.pdf,
      video = EXCLUDED.video,
      image = EXCLUDED.image,
      videos_image_uri = EXCLUDED.videos_image_uri,
      videos_frame = EXCLUDED.videos_frame,
      blue = EXCLUDED.blue,
      gray = EXCLUDED.gray,
      min_delivery_days = EXCLUDED.min_delivery_days,
      max_delivery_days = EXCLUDED.max_delivery_days,
      country = EXCLUDED.country,
      mine_of_origin = EXCLUDED.mine_of_origin,
      canada_mark_eligible = EXCLUDED.canada_mark_eligible,
      labgrown_type = EXCLUDED.labgrown_type,
      lg = EXCLUDED.lg,
      is_returnable = EXCLUDED.is_returnable,
      is_diavaia = EXCLUDED.is_diavaia,
      published = EXCLUDED.published,
      aset = EXCLUDED.aset,
      aset_link = EXCLUDED.aset_link;
  `

  const values = batch.flatMap((row) => [
    row.diamond_id,
    row.stock_id,
    row.ReportNo,
    row.shape,
    row.fullShape,
    parseFloat(row.carats || '0'),
    row.col,
    row.clar,
    row.cut,
    row.pol,
    row.symm,
    row.flo,
    row.floCol,
    row.eyeClean,
    row.brown,
    row.green,
    row.milky,
    row.fancyColor,
    row.fancyOvertone,
    row.fancyIntensity,
    row.colorShade,
    parseFloat(row.length || '0'),
    parseFloat(row.width || '0'),
    parseFloat(row.height || '0'),
    parseFloat(row.depth || '0'),
    parseFloat(row.table || '0'),
    row.culet,
    row.girdle,
    parseFloat(row.starLength || '0'),
    parseFloat(row.lowerGirdle || '0'),
    parseFloat(row.crownHeight || '0'),
    parseFloat(row.crownAngle || '0'),
    parseFloat(row.pavAngle || '0'),
    parseFloat(row.pavHeight || '0'),
    parseFloat(row.pavDepth || '0'),
    row.discount,
    parseFloat(row.price || '0'),
    parseFloat(row.markup_price || '0'),
    row.markup_currency,
    parseFloat(row.price_per_carat || '0'),
    parseFloat(row.deliveredPrice || '0'),
    row.lab,
    row.pdf,
    row.video,
    row.image,
    row.videosImageUri,
    parseFloat(row.videosFrame || '0'),
    row.blue,
    row.gray,
    parseInt(row.minDeliveryDays || '0'),
    parseInt(row.maxDeliveryDays || '0'),
    row.country,
    row.mine_of_origin,
    row.canada_mark_eligible === 'TRUE',
    row.labgrownType,
    row.lg,
    row.is_returnable === 'Y',
    true,
    true,
    row.aset,
    row.aset_link,
  ])

  await client.query(query, values)
}
