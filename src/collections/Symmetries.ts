import type { CollectionConfig } from 'payload'

export const Symmetries: CollectionConfig = {
  slug: 'symmetries',
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