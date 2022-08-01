import compression from 'compression'
import express from 'express'
import { StatusCodes } from 'http-status-codes'

import { ApiError } from '@/utils'
import { errorConverter, errorHandler } from '../middlewares/error'
import v1Router from './v1'

const router = express.Router()

router.use(compression())
router.use('/v1', v1Router)

router.use((req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, 'Not found'))
})

// convert error to ApiError, if needed
router.use(errorConverter)

// handle error
router.use(errorHandler)

export default router
