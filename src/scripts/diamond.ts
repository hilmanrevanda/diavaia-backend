/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClient } from '@/utils/db'
import { syncFromFtp } from '@/utils/syncFromFtp'

export async function syncDiamonds() {
  console.log('💎 Sync diamond...')

  const products = await syncFromFtp('Diavaia Inc._natural.csv')
  const client = await getClient()
  const db = client.db()
  const collection = db.collection('diamonds')

  const batchSize = 1000
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    const operations = batch.map((product: any) => ({
      updateOne: {
        filter: { stock_id: product.stock_id },
        update: {
          $set: {
            stock_id: product.stock_id,
            report_no: product?.ReportNo,
            shape: product?.shape,
            full_shape: product?.fullShape,
            carats: parseFloat(product?.carats || 0),
            col: product?.col,
            clar: product?.clar,
            cut: product?.cut,
            pol: product?.pol,
            symm: product?.symm,
            flo: product?.flo,
            flo_col: product?.floCol,
            eye_clean: product?.eyeClean,
            brown: product?.brown,
            green: product?.green,
            milky: product?.milky,
            fancy_color: product?.fancyColor,
            fancy_overtone: product?.fancyOvertone,
            fancy_intensity: product?.fancyIntensity,
            color_shade: product?.colorShade,
            length: parseFloat(product?.length || 0),
            width: parseFloat(product?.width || 0),
            height: parseFloat(product?.height || 0),
            depth: parseFloat(product?.depth || 0),
            table: parseFloat(product?.table || 0),
            culet: product?.culet,
            girdle: product?.girdle,
            star_length: parseFloat(product?.starLength || 0),
            lower_girdle: parseFloat(product?.lowerGirdle || 0),
            crown_height: parseFloat(product?.crownHeight || 0),
            crown_angle: parseFloat(product?.crownAngle || 0),
            pav_angle: parseFloat(product?.pavAngle || 0),
            pav_height: parseFloat(product?.pavHeight || 0),
            pav_depth: parseFloat(product?.pavDepth || 0),
            discount: product?.discount,
            price: parseFloat(product?.price || 0),
            markup_price: parseFloat(product?.markup_price || 0),
            markup_currency: product?.markup_currency,
            price_per_carat: parseFloat(product?.price_per_carat || 0),
            delivered_price: parseFloat(product?.deliveredPrice || 0),
            lab: product?.lab,
            pdf: product?.pdf,
            video: product?.video,
            image: product?.image,
            videos_image_uri: product?.videosImageUri,
            videos_frame: parseFloat(product?.videosFrame || 0),
            blue: product?.blue,
            gray: product?.gray,
            min_delivery_days: parseInt(product?.minDeliveryDays || 0),
            max_delivery_days: parseInt(product?.maxDeliveryDays || 0),
            country: product?.country,
            mine_of_origin: product?.mine_of_origin,
            canada_mark_eligible: product?.canada_mark_eligible === 'TRUE',
            labgrown_type: product?.labgrownType,
            lg: product?.lg,
            is_returnable: product?.is_returnable === 'Y',
            published: true,
          },
        },
        upsert: true,
      },
    }))

    const result = await collection.bulkWrite(operations)
    console.log(`✅ Diamond Batch ${i / batchSize + 1}: ${result.modifiedCount} modified`)
  }
  await client.close()
}
