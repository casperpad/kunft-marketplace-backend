import express from 'express'
import { getTokens as _getTokens } from '@/services/token'

export const getTokens = async (
  req: express.Request,
  res: express.Response,
) => {
  const { collection } = req.params
  const { page, limit } = req.query

  const tokens = await _getTokens({
    where: { slug: collection },
    page: 1,
    limit: 20,
  })
  res.json(tokens)
}
