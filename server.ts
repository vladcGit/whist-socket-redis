import http from "http";
import { Server } from "socket.io";
import { configDotenv } from "dotenv";

import app from "./app";
import sockets from "./sockets";

configDotenv();

const httpServer = http.createServer(app);
const socketServer = new Server(httpServer);

const port = Number(process.env.PORT) || 3000;

httpServer.listen(port, () => {
  console.log(`listening on port ${port}`);
});

sockets.listen(socketServer);
