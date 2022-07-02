import { Model } from 'mongoose'
import { Schema, model } from 'mongoose'

interface IAsset {
  collectionNFT: Schema.Types.ObjectId
  tokenId: string
  image: string
  name: string
  owner: string
  metadata: string
}

type AssetModel = Model<IAsset>

const nftSchema = new Schema<IAsset, AssetModel>({
  collectionNFT: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'CollectionNFT',
  },
  tokenId: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
  },
  metadata: {
    type: String,
    required: true,
  },
})

const Asset = model<IAsset, AssetModel>('Asset', nftSchema)

export default Asset
