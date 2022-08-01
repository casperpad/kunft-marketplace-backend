import mongoose, { Schema } from 'mongoose'
import {
  OfferDocument,
  OfferModel,
  OfferSchema,
} from '../interfaces/mongoose.gen'

const OfferSchema: OfferSchema = new Schema(
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
    owner: {
      type: String,
    },
    additionalRecipient: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'suceed', 'canceled'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true },
)

export const Offer = mongoose.model<OfferDocument, OfferModel>(
  'Offer',
  OfferSchema,
)
