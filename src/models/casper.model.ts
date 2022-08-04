import mongoose, { Schema } from 'mongoose'

const CasperSchema = new Schema(
  {
    lasteEventId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true },
)

export const Casper = mongoose.model('Casper', CasperSchema)
