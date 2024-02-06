import http from "http";
import axios from "axios";
import { Server } from "socket.io";
import { configDotenv } from "dotenv";

import {} from "./environment";
import app from "./app";
import sockets from "./sockets";
import client from "./repositories/redis.repo";

configDotenv();

const httpServer = http.createServer(app);
const socketServer = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

const port = Number(process.env.PORT) || 3000;

setInterval(async () => {
  const res = await axios.get("https://whist.onrender.com/");
  console.log(res.status);
}, 60_000);

httpServer.listen(port, async () => {
  await client.connect();
  console.log(`listening on port ${port}`);
});

sockets.listen(socketServer);
