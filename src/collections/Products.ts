/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'stock_id',
    components: {
      beforeListTable: ['./components/ImportButtons'],
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
              data: product,
              user: req.user,
            })
            created.push(result)
          } catch (err) {
            console.error('Error creating product:', err)
            // Bisa tambahkan error detail per record jika perlu
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
