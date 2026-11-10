import IORedis from "ioredis";
import { config } from "dotenv";

config();

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
//   tls: {},
  protocol: 2,
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  console.log("Redis TCP connection established");
});

redisConnection.on("ready", () => {
  console.log("Redis authenticated and ready!");
});

redisConnection.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redisConnection;