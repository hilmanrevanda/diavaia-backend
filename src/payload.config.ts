// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { ProductCategories } from './collections/ProductCategories'
import { Colors } from './collections/Colors'
import { Cuts } from './collections/Cuts'
import { Clarities } from './collections/Clarities'
import { Certifications } from './collections/Certifications'
import { Symmetries } from './collections/Symmetries'
import { Polishes } from './collections/Polishes'
import { Fluorescences } from './collections/Fluorescences'
import { GirdleThicknesses } from './collections/GirdleThicknesses'
import { Jewellery } from './collections/Jewellery'
import { NaturalDiamonds } from './collections/NaturalDiamonds'
import { NaturalColoredDiamonds } from './collections/NaturalColoredDiamonds'
import { LaboratoryGrownColoredDiamonds } from './collections/LaboratoryGrownColoredDiamonds'
import { LaboratoryGrownDiamonds } from './collections/LaboratoryGrownDiamonds'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    NaturalDiamonds,
    NaturalColoredDiamonds,
    LaboratoryGrownDiamonds,
    LaboratoryGrownColoredDiamonds,
    Jewellery,
    ProductCategories,
    Colors,
    Cuts,
    Clarities,
    Certifications,
    Symmetries,
    Polishes,
    Fluorescences,
    GirdleThicknesses,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Postgres-specific arguments go here.
    // `pool` is required.
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  graphQL: {
    disable: false,
  },
  cors: '*',
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
      {
        label: 'Arabic',
        code: 'ar',
        rtl: true,
      },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
})
