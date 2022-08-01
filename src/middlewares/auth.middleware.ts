import express from 'express'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { JWT_NAME, JWT_SECRET } from '@/config'
import { ApiError } from '@/utils'

export const auth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const token = req.cookies[JWT_NAME]
  if (token === undefined) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Authentication')
  }
  try {
    jwt.verify(token, JWT_SECRET, (error: any, decoded: any) => {
      if (error) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Authentication')
      }

      // eslint-disable-next-line no-param-reassign
      req.headers.user = decoded
      next()
    })
  } catch (err: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: err.message || 'Internal error',
    })
  }
}
