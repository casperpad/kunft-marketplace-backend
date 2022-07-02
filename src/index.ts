import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import compression from 'compression'
import morgan from 'morgan'
import appRouter from 'routes/index.routes'
import mongoose from 'mongoose'
import responseTime from 'response-time'

import redisClient from '@providers/redis'

dotenv.config()

const app = express()

const PORT = process.env.PORT || 8000
const SENTRY_DSN = process.env.SENTRY_DSN
const MONGODB_URL = process.env.MONGODB_URL!

// Global rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute
})

if (SENTRY_DSN)
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  })

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler())
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())

app.use(compression())
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ limit: '25mb', extended: true }))
app.use(morgan('dev'))
app.use(limiter)
app.use(responseTime())

app.use(appRouter)

app.use(Sentry.Handlers.errorHandler())

async function startServer() {
  await mongoose.connect(MONGODB_URL).then(() => {
    console.log(`Connected to MongoDB`)
  })

  await redisClient.connect()

  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
  })
}

startServer()
