import mongoose, { Schema, HydratedDocument } from 'mongoose'
import validator from 'validator'

interface User {
  publicKey: string
  verified: boolean
  firstName?: string
  lastName?: string
  avatar?: string
  description?: string
  email?: string
  emailVerified: boolean
  role: 'user' | 'admin'
  nonce: string
}

// UserSchema type
const UserSchema = new Schema({
  publicKey: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    lowercase: true,
    index: true,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },

  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  avatar: {
    type: String,
  },
  description: {
    type: String,
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
  nonce: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
})

UserSchema.statics = {
  async getNonce(publicKey: string): Promise<string | undefined> {
    const user = await this.findOne({ publicKey }).select('nonce')
    return user?.nonce
  },
  async findByPublicKey(
    publicKey: string,
  ): Promise<HydratedDocument<User> | null> {
    return await this.findOne({ publicKey })
  },
}

// NOTE: `this: UserDocument` is required for virtual properties to tell TS the type of `this` value using the "fake this" feature
// you will need to add these in after your first ever run of the CLI
UserSchema.virtual('name').get(function (this: HydratedDocument<User>) {
  return `${this.firstName} ${this.lastName}`
})

export const User = mongoose.model('User', UserSchema)
