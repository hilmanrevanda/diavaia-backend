import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        position: 'sidebar'
      }
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'product-categories',
      required: true
    },
    {
      name: 'color',
      type: 'relationship',
      relationTo: 'colors',
      admin: {
        condition: (_, siblingData) => {
            return siblingData?.category === "681dd7db9740d5196b491391"
        },
        position: 'sidebar'
      }
    },
    {
      name: 'cut',
      type: 'relationship',
      relationTo: 'cuts',
      admin: {
        condition: (_, siblingData) => siblingData?.category === "681dd7db9740d5196b491391",
        position: 'sidebar'
      }
    },
    {
      name: 'clarity',
      type: 'relationship',
      relationTo: 'clarities',
      admin: {
        condition: (_, siblingData) => siblingData?.category === "681dd7db9740d5196b491391",
        position: 'sidebar'
      }
    },
    {
      name: 'certification',
      type: 'relationship',
      relationTo: 'certifications',
      admin: {
        condition: (_, siblingData) => siblingData?.category === "681dd7db9740d5196b491391",
        position: 'sidebar'
      }
    },
    {
      name: 'symmetry',
      type: 'relationship',
      relationTo: 'symmetries',
      admin: {
        condition: (_, siblingData) => siblingData?.category === "681dd7db9740d5196b491391",
        position: 'sidebar'
      }
    },
    {
      name: 'polish',
      type: 'relationship',
      relationTo: 'polishes',
      admin: {
        condition: (_, siblingData) => siblingData?.category === "681dd7db9740d5196b491391",
        position: 'sidebar'
      }
    },
    {
      name: 'fluorescence',
      type: 'relationship',
      relationTo: 'fluorescences',
      admin: {
        condition: (_, siblingData) => siblingData?.category === "681dd7db9740d5196b491391",
        position: 'sidebar'
      }
    },
    {
      name: 'girdleThickness',
      type: 'relationship',
      relationTo: 'girdle-thicknesses',
      admin: {
        condition: (_, siblingData) => siblingData?.category === "681dd7db9740d5196b491391",
        position: 'sidebar'
      }
    },
  ],
}