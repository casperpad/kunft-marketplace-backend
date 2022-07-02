import { Model } from 'mongoose'
import { Schema, model } from 'mongoose'

interface IBuyOrder {
  creator: string
  asset: Schema.Types.ObjectId
  owner: string
  payToken?: string
  price: string
  startTime: number
  additionalRecipient?: string
  status: 'pending' | 'succeed' | 'canceled'
}

type BuyOrderModel = Model<IBuyOrder>

const buyOrderSchema = new Schema<IBuyOrder, BuyOrderModel>({
  creator: {
    type: String,
    required: true,
  },
  asset: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  owner: {
    type: String,
    required: true,
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
    enum: ['pending', 'succed', 'canceld'],
    required: true,
  },
})

const BuyOrder = model<IBuyOrder, BuyOrderModel>('BuyOrder', buyOrderSchema)

export default BuyOrder
