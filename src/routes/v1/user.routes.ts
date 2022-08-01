import express from 'express'
import { addToken } from '@/controllers/user.controller'
import { validate, auth } from '@/middlewares'
import { userValidation } from '@/validations'

const router = express.Router()

router.post('/add-token', auth, validate(userValidation.addToken), addToken)

export default router
