import express from 'express'
import { tokenServices } from '@/services'
import catchAsync from '@/utils/catchAsync'

export const addToken = catchAsync(
  async (req: express.Request, res: express.Response) => {
    const { contractPackageHash, contractHash, tokenId } = req.body
    const result = await tokenServices.addToken(
      contractPackageHash,
      contractHash,
      tokenId,
    )
    res.json(result)
  },
)
