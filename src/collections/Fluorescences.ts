import type { CollectionConfig } from 'payload'

export const Fluorescences: CollectionConfig = {
  slug: 'fluorescences',
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