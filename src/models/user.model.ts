import mongoose, { Schema } from 'mongoose'
import validator from 'validator'
import { UserDocument, UserModel } from '../interfaces/mongoose.gen'

// UserSchema type
const UserSchema = new Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  nonce: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    lowercase: true,
    index: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please fill a valid email address'],
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
})

// NOTE: `this: UserDocument` is required for virtual properties to tell TS the type of `this` value using the "fake this" feature
// you will need to add these in after your first ever run of the CLI
UserSchema.virtual('name').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`
})

UserSchema.statics = {
  async getNonce(publicKey: string): Promise<string | undefined> {
    const user = await this.findOne({ publicKey }).select('nonce')
    return user?.nonce
  },
  async findByPublicKey(publicKey: string): Promise<UserDocument | null> {
    return await this.findOne({ publicKey })
  },
}

export const User = mongoose.model<UserDocument, UserModel>('User', UserSchema)
