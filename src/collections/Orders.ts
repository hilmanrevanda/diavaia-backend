/* eslint-disable @typescript-eslint/no-explicit-any */
import { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
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
  admin: {
    useAsTitle: 'order_id',
  },
  fields: [
    {
      name: 'order_id',
      required: true,
      unique: true,
      label: 'Order ID',
      type: 'text',
    },
    {
      name: 'status',
      required: true,
      label: 'Order Status',
      type: 'text',
    },
    {
      name: 'email',
      required: true,
      label: 'Email',
      type: 'email',
    },
    {
      name: 'amounts',
      required: true,
      label: 'Amounts',
      type: 'number',
    },
    {
      name: 'biling_informations',
      label: 'Billing Informations',
      type: 'group',
      fields: [
        {
          name: 'address',
          label: 'Address',
          type: 'text',
          required: true,
        },
        {
          name: 'address_2',
          label: 'Address 2',
          type: 'text',
        },
        {
          name: 'first_name',
          label: 'First Name',
          type: 'text',
          required: true,
        },
        {
          name: 'last_name',
          label: 'Last Name',
          type: 'text',
          required: true,
        },
        {
          name: 'country',
          label: 'Country',
          type: 'text',
          required: true,
        },
        {
          name: 'provinces',
          label: 'Provinces',
          type: 'text',
          required: true,
        },
        {
          name: 'city',
          label: 'City',
          type: 'text',
          required: true,
        },
        {
          name: 'zip_code',
          label: 'Zip Code',
          type: 'text',
          required: true,
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'carts',
      label: 'Carts',
      type: 'array',
      fields: [
        {
          name: 'product_id',
          label: 'Product ID',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
        },
        {
          name: 'color',
          label: 'Color',
          type: 'text',
          required: true,
        },
        {
          name: 'cut',
          label: 'Cut',
          type: 'text',
          required: true,
        },
        {
          name: 'clarity',
          label: 'Clarity',
          type: 'text',
          required: true,
        },
        {
          name: 'price',
          label: 'Price',
          type: 'text',
          required: true,
        },
        {
          name: 'imageUrl',
          label: 'Image Url',
          type: 'text',
          required: true,
        },
        {
          name: 'max_delivery_days',
          label: 'Max Delivery Days',
          type: 'number',
          required: true,
        },
        {
          name: 'type',
          label: 'Type',
          type: 'text',
          required: true,
        },
        {
          name: 'lab',
          label: 'Lab',
          type: 'text',
          required: true,
        },
        {
          name: 'hsCode',
          label: 'HS Code',
          type: 'text',
        },
      ],
    },
  ],
  endpoints: [
    {
      path: '/create',
      method: 'post',
      handler: async (req: any) => {
        const data = (await req.json()) as any
        
        await req.payload.create({
          collection: 'orders',
          data: {
            order_id: data.payload.order_id,
            status: 'pending_supplier_confirmation',
            email: data.payload.email,
            amounts: 10000,
            biling_informations: {
              address: data.payload.address,
              address_2: data.payload.address_2,
              first_name: data.payload.first_name,
              last_name: data.payload.last_name,
              country: data.payload.country,
              provinces: data.payload.province,
              city: data.payload.city,
              zip_code: data.payload.zipcode,
              phone: data.payload.phone,
            },
            carts: data.payload.carts,
          },
        })
        return Response.json({
          data: {},
          message: 'test',
        })
      },
    },
  ],
}
