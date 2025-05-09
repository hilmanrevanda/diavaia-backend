import type { CollectionConfig } from 'payload'

export const Cuts: CollectionConfig = {
  slug: 'cuts',
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