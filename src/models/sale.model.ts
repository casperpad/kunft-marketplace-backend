import mongoose, { Schema } from 'mongoose'
import { SaleSchema } from '../interfaces/mongoose.gen'

const SaleSchema = new Schema(
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
  },
  { timestamps: true },
)

export const Sale = mongoose.model('Sale', SaleSchema)
