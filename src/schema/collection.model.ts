import { Schema, model, Model } from 'mongoose'

interface ICollection {
  contractPackageHash: string
  contractHash: string
  slug: string
  name: string
  symbol: string
  description?: string
  verified: boolean
  image?: string
  twitter?: string
  discord?: string
  website?: string
}

type CollectionModel = Model<ICollection>

const collectionSchema = new Schema<ICollection, CollectionModel>({
  contractPackageHash: {
    type: String,
    required: true,
    unique: true,
  },
  contractHash: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  slug: { type: String, required: true, unique: true, dropDups: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  verified: { type: Boolean, required: true },
  image: { type: String },
  twitter: { type: String },
  discord: { type: String },
  website: { type: String },
})

const Collection = model<ICollection, CollectionModel>(
  'Collection',
  collectionSchema,
)

export default Collection
