import { Schema, model, Model } from 'mongoose'

interface IUser {
  name: string
  email?: string
  accountHash: string
  nonce: string
  emailVerified: boolean
  // role:"user"|"minter"|"admin"
}

type UserModel = Model<IUser>

const userSchema = new Schema<IUser, UserModel>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    dropDups: true,
  },
  emailVerified: {
    type: Boolean,
  },
  accountHash: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
})

const User = model<IUser, UserModel>('User', userSchema)

export default User
