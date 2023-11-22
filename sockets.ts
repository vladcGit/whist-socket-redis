import { Server } from "socket.io";
import { deserializeToken } from "./services/jwt.service";
import {
  getRoomData,
  playCard,
  startGame,
  vote,
} from "./services/redis/game.redis.service";
import { getUserCards } from "./services/redis/user.redis.service";

const listen = (io: Server) => {
  io.on("connection", async (socket) => {
    const token: string = socket.handshake.auth.token;
    const userId = deserializeToken(token);
    const roomId = userId.split(":")[0].split("#")[1];

    if (!token || !roomId) {
      throw new Error("Invalid credentials");
    }

    // check if room exists
    socket.join(roomId);

    console.log("a user connected", socket.id);

    socket.on("newPlayer", async () => {
      const data = await getRoomData(roomId);
      io.to(roomId).emit("newPlayer", data);
    });

    socket.on("startGame", async () => {
      await startGame(roomId);
      io.to(roomId).emit("startGame");
    });

    socket.on("getPublicData", async () => {
      const data = await getRoomData(roomId);
      socket.emit("publicData", data);
    });

    socket.on("vote", async (v: number) => {
      await vote(roomId, userId, v);
    });

    socket.on("playedCard", async (card: string) => {
      await playCard(roomId, userId, card);
      io.to(roomId).emit("playedCard", { userId, card });
    });

    socket.on("whatAreMyCards", async () => {
      const data = await getUserCards(userId);
      socket.emit("yourCards", data.join(","));
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client ${socket.id} disconnected: ${reason}`);
      socket.leave(roomId);
    });
  });
};

export default { listen };
