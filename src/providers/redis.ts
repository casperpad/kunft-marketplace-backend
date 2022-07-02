import { REDIS_URL } from 'config'
import * as redis from 'redis'

// create redis redisClient
const redisClient = redis.createClient({
  url: REDIS_URL,
})

redisClient.on('connect', function () {
  console.log(`Redis connected : ${REDIS_URL}`)
})

export default redisClient
