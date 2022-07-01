import express from 'express'
import collectionsRouter from './collections.routes'

const appRouter = express.Router()

appRouter.use('/collections', collectionsRouter)

export default appRouter
