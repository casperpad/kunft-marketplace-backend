import mongoose, { Schema } from 'mongoose'
import { SaleSchema, SaleDocument, SaleModel } from '@/interfaces/mongoose.gen'

const SaleSchema: SaleSchema = new Schema(
  {
    creator: {
      type: String,
      required: true,
    },
    token: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Token',
    },
    buyer: {
      type: String,
    },
    payToken: {
      type: String,
    },
    price: {
      type: String,
      required: true,
    },
    startTime: {
      type: Number,
      required: true,
    },
    additionalRecipient: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'succeed', 'canceled'],
      default: 'pending',
      required: true,
    },
    pendingDeployHash: {
      type: String,
      required: true,
    },
    succeedDeployHash: String,
    canceledDeployHash: String,
  },
  { timestamps: true },
)

export const Sale = mongoose.model<SaleDocument, SaleModel>('Sale', SaleSchema)
