import { PRODUCTTYPE } from '@/constants/product-type-jewellery'
import { CollectionConfig } from 'payload'

export const Jewellery: CollectionConfig = {
  slug: 'Jewelleries',
  admin: {
    group: 'Products',
    useAsTitle: 'ref_diavaia',
    components: {
      beforeListTable: ['./components/ImportButton'],
    },
  },
  fields: [
    { name: 'ref_diavaia', type: 'text', label: 'Ref Diavaia', required: true, unique: true },
    { name: 'product_type', type: 'select', label: 'Product Type', options: PRODUCTTYPE },
    {
      name: 'metal_type',
      label: 'Metal Type',
      type: 'text',
    },
    {
      name: 'total_stones',
      type: 'number',
      label: 'Total Stones',
    },
    {
      name: 'stone_type',
      type: 'text',
      label: 'Stone Type',
    },
    {
      name: 'stone_colour',
      type: 'text',
      label: 'Stone Colour',
    },
    {
      name: 'stone_clarity',
      type: 'text',
      label: 'Stone Clarity',
    },
    {
      name: 'weight',
      type: 'number',
      label: 'Weight/Stone (Ct)',
    },
    {
      name: 'ctw',
      type: 'number',
      label: 'CTW',
    },
    {
      name: 'retail_price',
      type: 'text',
      label: 'Retail Price',
    },
  ],
}
