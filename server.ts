import http from "http";
import { Server } from "socket.io";
import { configDotenv } from "dotenv";

import {} from "./environment";
import app from "./app";
import sockets from "./sockets";
import client from "./repositories/redis.repo";
import { exec } from "child_process";

configDotenv();

const httpServer = http.createServer(app);
const socketServer = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

const port = Number(process.env.PORT) || 3000;

setInterval(() => {
  exec("ping www.whist.onrender.com", function (err, stdout, stderr) {
    err && console.log(err);
    stderr && console.log(stderr);
    console.log(stdout);
  });
}, 2000);

httpServer.listen(port, async () => {
  await client.connect();
  console.log(`listening on port ${port}`);
});

sockets.listen(socketServer);
