import type { CollectionConfig } from 'payload'

export const Colors: CollectionConfig = {
  slug: 'colors',
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