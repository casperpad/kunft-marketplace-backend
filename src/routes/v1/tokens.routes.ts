import express from 'express'
import { tokenController } from '@/controllers'

const router = express.Router()

router.get('/:collection', tokenController.getTokens)

export default router
