// const { Redis } = require("ioredis");

// let redisInstance;

// const createInstance = () => {
//   return new Redis({
//     port: process.env.REDIS_PORT,
//     host: process.env.REDIS_HOST,
//     username: process.env.REDIS_USER,
//     password: process.env.REDIS_PASSWORD,
//     maxRetriesPerRequest: null,
//   });
// };

// const getRedisInstance = () => {
//   if (!redisInstance) {
//     redisInstance = createInstance();
//     redisInstance.on('connect', () => console.log("Redis Connected"));
//     redisInstance.on('error', (err) => console.error('Redis error', err));
//   }

//   return redisInstance;
// };

// module.exports = getRedisInstance;
