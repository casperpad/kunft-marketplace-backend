import * as redis from 'redis'
import dotenv from 'dotenv'
dotenv.config()

// create redis redisClient
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
})

redisClient.on('connect', function () {
  console.log(`Redis connected : ${process.env.REDIS_URL}`)
})

export default redisClient
