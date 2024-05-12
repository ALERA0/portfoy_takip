const { Redis } = require("ioredis");

let redisInstance;

const createInstance = () => {
  return new Redis({
    port: process.env.REDISPORT,
    host: process.env.REDISHOST,
    username: process.env.REDISUSER,
    password: process.env.REDISPASSWORD,
    maxRetriesPerRequest: null,
  });
};

const getRedisInstance = () => {
  // if (!redisInstance) {
  //   redisInstance = createInstance();
  //   // redisInstance.on('connect', () => console.log("Redis Connected"));
  //   // redisInstance.on('error', (err) => console.error('Redis error', err));
  // }

  return redisInstance;
};

module.exports = getRedisInstance;
