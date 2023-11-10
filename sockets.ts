import { Server } from "socket.io";
import { deserializeToken } from "./services/jwt.service";
import RedisService from "./services/redis.service";

const listen = (io: Server) => {
  io.on("connection", async (socket) => {
    const roomId: string = socket.handshake.auth.roomId;
    const token: string = socket.handshake.auth.token;
    const userId = deserializeToken(token);
    if (!token || !roomId) {
      throw new Error("Invalid credentials");
    }
    const redisService = new RedisService(roomId);
    socket.join(roomId);

    console.log("a user connected", socket.id);

    socket.on("secure", (card: string) => {
      socket.emit("secureMessage", socket.id);
    });

    socket.on("public", () => {
      io.to(roomId).emit("publicMessage");
    });

    socket.on("newPlayer", async () => {
      const data = await redisService.getPublicData();
      io.to(roomId).emit("newPlayer", data);
    });

    socket.on("startGame", async () => {
      await redisService.startGame(userId);
      const data = redisService.getPublicData();
      io.to(roomId).emit("startGame", data);
    });

    socket.on("playedCard", async (card: string) => {
      await redisService.playCard(userId, card);
      io.to(roomId).emit("playedCard", { userId, card });

      const roundEnded = await redisService.checkRoundOver();
      if (roundEnded) {
        const data = await redisService.endRound();
        io.to(roomId).emit("endRound", data);

        const gameEnded = await redisService.checkGameOver();

        if (gameEnded) {
          io.to(roomId).emit("endGame");
        }
      }
    });

    socket.on("whatAreMyCards", async () => {
      const data = await redisService.getUserCards(userId);
      socket.emit("yourCards", data);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client ${socket.id} disconnected: ${reason}`);
      socket.leave(roomId);
    });
  });
};

export default { listen };
