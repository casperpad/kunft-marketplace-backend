import express from 'express'
import { tokenController } from '@/controllers'

const router = express.Router()

router.get('/:collection', tokenController.getTokens)
router.post('/add/:accountHash', tokenController.addUserToken)
export default router
