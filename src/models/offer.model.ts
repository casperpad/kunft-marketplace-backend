import mongoose, { Schema } from 'mongoose'
import { OfferDocument, OfferModel } from '../interfaces/mongoose.gen'
import { casperValidation } from '@/validations'

const OfferSchema = new Schema(
  {
    creator: {
      type: String,
      required: true,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    token: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Token',
    },
    payToken: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
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
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
    },
    additionalRecipient: {
      type: String,
      validate: [casperValidation.isValidHash, 'Invalid Hash'],
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

export const Offer = mongoose.model('Offer', OfferSchema)
