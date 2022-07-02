import { Model } from 'mongoose'
import { Schema, model } from 'mongoose'

interface ISellOrder {
  creator: string
  asset: Schema.Types.ObjectId
  payToken?: string
  price: string
  startTime: number
  buyer?: string
  additionalRecipient?: string
  status: 'pending' | 'succeed' | 'canceled'
}

type SellOrderModel = Model<ISellOrder>

const sellOrderSchema = new Schema<ISellOrder, SellOrderModel>(
  {
    creator: {
      type: String,
      required: true,
    },
    asset: {
      type: Schema.Types.ObjectId,
      required: true,
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
      enum: ['pending', 'suceed', 'canceled'],
      required: true,
    },
  },
  { timestamps: true },
)

const SellOrder = model<ISellOrder, SellOrderModel>(
  'SellOrder',
  sellOrderSchema,
)

export default SellOrder
