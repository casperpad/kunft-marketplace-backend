import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 8000
const SENTRY_DSN = process.env.SENTRY_DSN
const MONGODB_URL = process.env.MONGODB_URL!
const REDIS_URL = process.env.REDIS_URL!

export { PORT, SENTRY_DSN, MONGODB_URL, REDIS_URL }
