import { COUNTRIES } from '@/constants/country'
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'email'],
  },
  auth: true,
  access: {
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return {
        id: {
          equals: req.user?.id,
        },
      }
    },
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return {
        id: {
          equals: req.user?.id,
        },
      }
    },
    delete: ({ req }) => req.user?.role === 'admin',
    create: () => true,
  },
  fields: [
    {
      name: 'civility',
      type: 'select',
      required: true,
      options: [
        { label: 'Mx', value: 'mx' },
        { label: 'Mr', value: 'mr' },
        { label: 'Mrs', value: 'mrs' },
        { label: 'Ms', value: 'ms' },
      ],
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'country',
      type: 'select',
      required: true,
      options: COUNTRIES,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}
