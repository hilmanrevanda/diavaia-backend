import type { CollectionConfig } from 'payload'

export const Polishes: CollectionConfig = {
  slug: 'polishes',
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