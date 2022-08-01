/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 8000
const {
  SENTRY_DSN,
  NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS,
  NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
} = process.env
const MONGODB_URL = process.env.MONGODB_URL!
const REDIS_URL = process.env.REDIS_URL!
const NODE_ENV = process.env.NODE_ENV as 'development' | 'production'
const APP_ENV = process.env.APP_ENV || 'development'

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'r4u7x!A%D*G-KaPdSgVkXp2s5v8y/B?E(H+MbQeThWmZq3t6w9z$C&F)J@NcRfUjXn2r5u7x!A%D*G-KaPdSgVkYp3s6v9y/B?E(H+MbQeThWmZq4t7w!z%C&F)J@NcRfUjXn2r5u8x/A?D(G-KaPdSgVkYp3s6v9y$B&E)H@MbQeThWmZq4t7w!z%C*F-JaNdRfUjXn2r5u8x/A?D(G+KbPeShVmYp3s6v9y$B&E)H@McQfTjWnZr4t7w!z%C*F-JaNdRgUkXp2s5v8x/A?D(G+KbPeShVmYq3t6w9z$B&E)H@McQfTjWnZr4u7x!A%D*F-JaNdRgUkXp2s5v8y/B?E(H+KbPeShVmYq3t6w9z$C&F)J@NcQfTjWnZr4u7x!A%D*G-KaPdSgUkXp2s5v8y/B?E(H+MbQeThWmYq3t6w9z$C&F)J@NcRfUjXn2r4u7x!A%D*G-KaPdSgVkYp3s6v8y/B?E(H+MbQeThWmZq4t7w!z$C&F)J@NcRfUjXn'
const JWT_EXPIRE = 15 * 24 * 3600
const JWT_NAME = 'kunft'

export {
  PORT,
  SENTRY_DSN,
  MONGODB_URL,
  REDIS_URL,
  JWT_SECRET,
  JWT_EXPIRE,
  JWT_NAME,
  NODE_ENV,
  APP_ENV,
  NEXT_PUBLIC_CASPER_EVENT_STREAM_ADDRESS,
  NEXT_PUBLIC_MARKETPLACE_CONTRACT_PACKAGE_HASH,
  NEXT_PUBLIC_CASPER_CHAIN_NAME,
  NEXT_PUBLIC_CASPER_NODE_ADDRESS,
}
