import type { CollectionConfig } from 'payload'

export const GirdleThicknesses: CollectionConfig = {
  slug: 'girdle-thicknesses',
  admin: {
    useAsTitle: 'title',
    group: 'Taxonomies',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
  ],
}