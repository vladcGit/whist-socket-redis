import { configDotenv } from "dotenv";
import { createClient } from "redis";

configDotenv();

const { REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;

const client = createClient({
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT),
  },
});

export default client;
