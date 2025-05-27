/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'stock_id',
    components: {
      beforeListTable: ['./components/ImportButton'],
    },
  },
  fields: [
    // 🆔 Identitas
    { name: 'stock_id', type: 'text', required: true, unique: true },
    { name: 'report_no', type: 'text', unique: true },

    // 🔷 Karakteristik Diamond
    { name: 'shape', type: 'text' },
    { name: 'full_shape', type: 'text' },
    { name: 'carats', type: 'number' },
    { name: 'col', type: 'text' },
    { name: 'clar', type: 'text' },
    { name: 'cut', type: 'text' },
    { name: 'pol', type: 'text' },
    { name: 'symm', type: 'text' },
    { name: 'flo', type: 'text' },
    { name: 'flo_col', type: 'text' },
    { name: 'eye_clean', type: 'text' },
    { name: 'brown', type: 'text' },
    { name: 'green', type: 'text' },
    { name: 'milky', type: 'text' },
    { name: 'fancy_color', type: 'text' },
    { name: 'fancy_overtone', type: 'text' },
    { name: 'fancy_intensity', type: 'text' },
    { name: 'color_shade', type: 'text' },

    // 📏 Dimensi & Proporsi
    { name: 'length', type: 'number' },
    { name: 'width', type: 'number' },
    { name: 'height', type: 'number' },
    { name: 'depth', type: 'number' },
    { name: 'table', type: 'number' },
    { name: 'culet', type: 'text' },
    { name: 'girdle', type: 'text' },
    { name: 'star_length', type: 'number' },
    { name: 'lower_girdle', type: 'number' },
    { name: 'crown_height', type: 'number' },
    { name: 'crown_angle', type: 'number' },
    { name: 'pav_angle', type: 'number' },
    { name: 'pav_height', type: 'number' },
    { name: 'pav_depth', type: 'number' },

    // 💵 Harga & Diskon
    { name: 'discount', type: 'text' },
    { name: 'price', type: 'number' },
    { name: 'markup_price', type: 'number' },
    { name: 'markup_currency', type: 'text' },
    { name: 'price_per_carat', type: 'number' },
    { name: 'delivered_price', type: 'number' },

    // 📄 Sertifikat & Media
    { name: 'lab', type: 'text' },
    { name: 'pdf', type: 'text' }, // bisa pakai type: 'upload' jika ingin mengelola file
    { name: 'video', type: 'text' },
    { name: 'image', type: 'text' },
    { name: 'videos_image_uri', type: 'text' },
    { name: 'videos_frame', type: 'number' },
    { name: 'blue', type: 'text' },
    { name: 'gray', type: 'text' },

    // 🚛 Pengiriman
    { name: 'min_delivery_days', type: 'number' },
    { name: 'max_delivery_days', type: 'number' },

    // 🌍 Asal & Jenis
    { name: 'country', type: 'text' },
    { name: 'mine_of_origin', type: 'text' },
    { name: 'canada_mark_eligible', type: 'checkbox', defaultValue: false },
    { name: 'labgrown_type', type: 'text' },
    { name: 'lg', type: 'text' },
    { name: 'is_returnable', type: 'checkbox', defaultValue: false },

    // Opsional: publish status & timestamps
    { name: 'published', type: 'checkbox', defaultValue: false },
  ],
  endpoints: [
    {
      path: '/import-csv',
      method: 'post',
      handler: async (req: any) => {
        const { products } = await req.json()

        if (!Array.isArray(products)) {
          return new Response(JSON.stringify({ error: 'Invalid format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const created = []
        for (const product of products) {
          try {
            const result = await req.payload.create({
              collection: 'products',
              data: {
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
                published: false,
              },
              user: req.user,
            })
            created.push(result)
          } catch (err) {
            console.error('Error creating product:', err)
            // Bisa tambahkan error detail per product jika perlu
          }
        }

        return Response.json({
          message: `Imported ${created.length} products`,
          created,
        })
      },
    },
  ],
}
