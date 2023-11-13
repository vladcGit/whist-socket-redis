import http from "http";
import { Server } from "socket.io";
import { configDotenv } from "dotenv";

import {} from "./environment";
import app from "./app";
import sockets from "./sockets";
import RedisService from "./services/redis.service";

configDotenv();

const httpServer = http.createServer(app);
const socketServer = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

const port = Number(process.env.PORT) || 3000;

httpServer.listen(port, async () => {
  await RedisService.connect();
  console.log(`listening on port ${port}`);
});

sockets.listen(socketServer);
