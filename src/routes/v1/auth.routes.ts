import express from 'express'
import { authController } from '@/controllers'
import { validate, auth } from '@/middlewares'
import { authValidation } from '@/validations'

const router = express.Router()

router.get('/check', auth, authController.checkAuth)

router.get('/:publicKey', authController.getNonce)

router.post('/signup', validate(authValidation.signUp), authController.signUp)

router.post('/signin', validate(authValidation.signIn), authController.signIn)

router.post('/signout', auth, authController.signOut)

router.patch(
  '/',
  auth,
  validate(authValidation.upateInfo),
  authController.updateInfo,
)

export default router
