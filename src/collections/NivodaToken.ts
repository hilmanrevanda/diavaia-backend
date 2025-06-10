import { CollectionConfig } from 'payload'

export const NivodaToken: CollectionConfig = {
  slug: 'nivoda-tokens',
  admin: {
    useAsTitle: 'token',
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'token', type: 'text' },
    { name: 'refresh_token', type: 'text' },
    { name: 'user_data', type: 'json' },
    { name: 'source', type: 'text' },
  ],
}
