import { CollectionConfig } from 'payload'

export const ColoredDiamond: CollectionConfig = {
  slug: 'coloredDiamonds',
  admin: {
    useAsTitle: 'diamond_id',
    components: {
      beforeListTable: ['./components/ImportButton'],
    },
  },
  fields: [
    // 🆔 Identitas
    { name: 'diamond_id', label: 'Diamond ID', type: 'text', required: true, unique: true },
    { name: 'stock_id', label: 'Stock ID', type: 'text', required: true, unique: true },
    { name: 'ReportNo', label: 'Report No', type: 'text' },

    // 🔷 Karakteristik Diamond
    { name: 'shape', label: 'Shape', type: 'text' },
    { name: 'fullShape', label: 'Full Shape', type: 'text' },
    { name: 'carats', label: 'Carats', type: 'number' },
    { name: 'col', label: 'Color', type: 'text' },
    { name: 'clar', label: 'Clarity', type: 'text' },
    { name: 'cut', label: 'Cut', type: 'text' },
    { name: 'pol', label: 'Polish', type: 'text' },
    { name: 'symm', label: 'Symmetry', type: 'text' },
    { name: 'flo', label: 'Fluorescence', type: 'text' },
    { name: 'floCol', label: 'Fluorescence Color', type: 'number' },
    { name: 'eyeClean', label: 'Eye Clean', type: 'text' },
    { name: 'brown', label: 'Brown', type: 'text' },
    { name: 'green', label: 'Green', type: 'text' },
    { name: 'milky', label: 'Milky', type: 'text' },
    { name: 'fancyColor', label: 'Fancy Color', type: 'text' },
    { name: 'fancyOvertone', label: 'Fancy Overtone', type: 'text' },
    { name: 'fancyIntensity', label: 'Fancy Intensity', type: 'text' },
    { name: 'colorShade', label: 'Color Shade', type: 'text' },

    // 📏 Dimensi & Proporsi
    { name: 'length', label: 'Length (mm)', type: 'number' },
    { name: 'width', label: 'Width (mm)', type: 'number' },
    { name: 'height', label: 'Height (mm)', type: 'number' },
    { name: 'depth', label: 'Depth (%)', type: 'number' },
    { name: 'table', label: 'Table (%)', type: 'number' },
    { name: 'culet', label: 'Culet', type: 'text' },
    { name: 'girdle', label: 'Girdle', type: 'text' },
    { name: 'starLength', label: 'Star Length (%)', type: 'number' },
    { name: 'lowerGirdle', label: 'Lower Girdle (%)', type: 'number' },
    { name: 'crownHeight', label: 'Crown Height (%)', type: 'number' },
    { name: 'crownAngle', label: 'Crown Angle (°)', type: 'number' },
    { name: 'pavAngle', label: 'Pavilion Angle (°)', type: 'number' },
    { name: 'pavHeight', label: 'Pavilion Height (%)', type: 'number' },
    { name: 'pavDepth', label: 'Pavilion Depth (%)', type: 'number' },

    // 💵 Harga & Diskon
    { name: 'discount', label: 'Discount', type: 'text' },
    { name: 'price', label: 'Price (USD)', type: 'number' },
    { name: 'markup_price', label: 'Markup Price', type: 'number' },
    { name: 'markup_currency', label: 'Markup Currency', type: 'text' },
    { name: 'price_per_carat', label: 'Price per Carat', type: 'number' },
    { name: 'deliveredPrice', label: 'Delivered Price', type: 'number' },

    // 📄 Sertifikat & Media
    { name: 'lab', label: 'Lab', type: 'text' },
    { name: 'pdf', label: 'PDF', type: 'text' },
    { name: 'video', label: 'Video', type: 'text' },
    { name: 'image', label: 'Image', type: 'text' },
    { name: 'videosImageUri', label: 'Video Preview Image', type: 'text' },
    { name: 'videosFrame', label: 'Video Frame', type: 'number' },
    { name: 'blue', label: 'Blue', type: 'number' },
    { name: 'gray', label: 'Gray', type: 'number' },

    // 🚛 Pengiriman
    { name: 'minDeliveryDays', label: 'Min Delivery Days', type: 'number' },
    { name: 'maxDeliveryDays', label: 'Max Delivery Days', type: 'number' },

    // 🌍 Asal & Jenis
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'mine_of_origin', label: 'Mine of Origin', type: 'text' },
    {
      name: 'canada_mark_eligible',
      label: 'CanadaMark Eligible',
      type: 'checkbox',
      defaultValue: false,
    },
    { name: 'labgrownType', label: 'Labgrown Type', type: 'text' },
    { name: 'lg', label: 'LG', type: 'text' },
    { name: 'is_returnable', label: 'Is Returnable', type: 'checkbox', defaultValue: false },

    // ✅ Publish
    { name: 'published', label: 'Published', type: 'checkbox', defaultValue: true },
  ],
}
