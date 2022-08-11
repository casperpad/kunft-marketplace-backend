import express from 'express'
import {
  getTokens as _getTokens,
  addUserToken as _addUserToken,
} from '@/services/token'
import catchAsync from '@/utils/catchAsync'

export const getTokens = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { collection } = req.params
    const { page, limit } = req.query

    const tokens = await _getTokens({
      where: {
        slug: collection,
        metadata: [{ key: 'eye', values: ['Cyan', 'Green'] }],
      },
      page: 1,
      limit: 20,
    })
    res.json(tokens)
  },
)

export const addUserToken = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { accountHash } = req.params
    const result = await _addUserToken(accountHash)
    res.json({ result: `${result} tokens added` })
  },
)
