import express from 'express'
import { tokenServices } from '@/services'
import catchAsync from '@/utils/catchAsync'

export const addToken = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { contractHash, tokenId } = req.body
    const result = await tokenServices.addToken(contractHash, tokenId)
    res.json(result)
  },
)
