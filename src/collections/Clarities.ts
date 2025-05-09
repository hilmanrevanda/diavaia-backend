import type { CollectionConfig } from 'payload'

export const Clarities: CollectionConfig = {
  slug: 'clarities',
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