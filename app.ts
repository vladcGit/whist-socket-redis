import express from "express";
import RedisService from "./services/redis.service";
import { serializeToken } from "./services/jwt.service";
import { gameType } from "./lib/types";

const app = express();
app.use(express.json());

app.get("/api/hello", (req, res) => {
  return res.status(200).json({ message: "Hello" });
});

app.post("/api/new-game", async (req, res) => {
  try {
    const username: string = req.body.username;
    const type: gameType = "1-8-1";
    if (!username) {
      throw new Error("You need to provide a username");
    }
    if (!type) {
      throw new Error("You need to provide a type of game (1-8-1 or 8-1-8)");
    }

    let roomId = Math.floor(Math.random() * 9999).toString();
    while (!(await RedisService.isUniqueRoomId(roomId))) {
      roomId = Math.floor(Math.random() * 9999).toString();
    }

    const service = new RedisService(roomId);
    await service.createGame(type);
    await service.addUserToGame(username);

    const token = serializeToken(roomId, username);
    res.cookie("Authorization", token, {
      signed: false,
    });
    return res.status(201).json({ roomId });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/api/join-game/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (await RedisService.isUniqueRoomId(id)) {
      throw new Error("This room does not exist");
    }

    const username: string = req.body.username;
    if (!username) {
      throw new Error("You need to provide a username");
    }

    const redisService = new RedisService(id);
    await redisService.addUserToGame(username);

    return res.redirect(`/room/${id}`);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default app;
