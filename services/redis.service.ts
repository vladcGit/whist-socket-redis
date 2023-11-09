import { createClient } from "redis";
import { configDotenv } from "dotenv";
import {
  UserCards,
  WhistGame,
  WhistPlayer,
  gameType,
  suite,
} from "../lib/types";

configDotenv();

const { REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;

// key for a WhistPlayer
export const getUserKey = (roomId: string, username: string): string => {
  return `room-${roomId}:user-${username}`;
};

// key for a set with all the unique users in a room
const getRoomUsersKey = (roomId: string): string => {
  return `room-${roomId}:users:unique`;
};

// key for a room (whist game)
const getRoomKey = (roomId: string): string => {
  return `room-${roomId}`;
};

const getUserCardsKey = (userId: string): string => {
  return `${userId}:cards`;
};

const getPlayedCardKey = (userId: string): string => {
  return `${userId}:played-card`;
};

export default class RedisService {
  private static clientInstance = createClient({
    password: REDIS_PASSWORD,
    socket: {
      host: REDIS_HOST,
      port: parseInt(REDIS_PORT),
    },
  });

  private readonly client;
  private readonly roomId;

  constructor(roomId: string) {
    this.client = RedisService.clientInstance;
    this.roomId = roomId;
  }

  public static async connect() {
    if (!RedisService.clientInstance.isReady) {
      RedisService.clientInstance.on("error", (err) =>
        console.log("Redis Client Error", err)
      );
      await RedisService.clientInstance.connect();
    }
  }

  public static async isUniqueRoomId(roomId: string): Promise<Boolean> {
    const key = getRoomKey(roomId);
    const exists = await RedisService.clientInstance.exists(key);
    return exists === 0;
  }

  async createGame(type: gameType): Promise<WhistGame> {
    const id = getRoomKey(this.roomId);
    await this.client.hSet(id, {
      round: 1,
      type,
    });

    return {
      id,
      users: [],
      round: 1,
      started: false,
      type,
    };
  }

  async addUserToGame(username: string): Promise<void> {
    const roomUsersKey = getRoomUsersKey(this.roomId);
    const newUserKey = getUserKey(this.roomId, username);

    const numberOfPlayers = await this.client.sCard(roomUsersKey);

    if (await this.client.sIsMember(roomUsersKey, newUserKey)) {
      throw new Error("A user with this name already exists in this room");
    }

    const payload = {
      id: newUserKey,
      index: numberOfPlayers,
      name: username,
      points: 0,
      cardsLeft: 1,
      voted: 0,
    };

    const arrayPromises: Promise<number | boolean>[] = [
      this.client.hSet(newUserKey, payload),
      this.client.sAdd(roomUsersKey, newUserKey),
    ];

    // if the room does not have any player, then the new user becomes the owner
    if (numberOfPlayers === 0) {
      arrayPromises.push(
        this.client.hSetNX(getRoomKey(this.roomId), "ownerId", newUserKey)
      );
    }

    await Promise.all(arrayPromises);
  }

  async startGame(userId: string): Promise<void> {
    const roomKey = getRoomKey(this.roomId);
    const ownerId = await this.client.hGet(roomKey, "ownerId");
    if (ownerId !== userId) {
      throw new Error("Only the owner can start a game");
    }

    await this.client.hSet(roomKey, "started", 1);
    // todo: whist service to give everyone cards
  }

  async getUsersData(): Promise<WhistPlayer[]> {
    const userIds = await this.client.sMembers(getRoomUsersKey(this.roomId));

    const promises = userIds.map((userId) => this.client.hGetAll(userId));
    const deserializedUsers = await Promise.all(promises);

    const users: WhistPlayer[] = deserializedUsers.map((user) => ({
      id: user.id,
      index: parseInt(user.index),
      name: user.name,
      points: parseInt(user.points),
      cardsLeft: parseInt(user.cardsLeft),
      voted: parseInt(user.voted),
      cards: user.cards,
    }));

    return users;
  }

  async getPublicData(): Promise<WhistGame> {
    const roomData = await this.client.hGetAll(getRoomKey(this.roomId));
    const users = await this.getUsersData();

    return {
      id: this.roomId,
      users,
      round: parseInt(roomData.round),
      started: roomData.started !== "0",
      type: roomData.type as gameType,
      ownerId: roomData.ownerId,
      turn: roomData.turn,
      atu: roomData.data as suite,
    };
  }

  async dealToPlayer(userId: string, cards: string) {
    await this.client.hSet(getUserCardsKey(userId), "cards", cards);
  }

  async getUsersCards(userId: string): Promise<UserCards> {
    const userCards = (await this.client.hGet(
      getUserCardsKey(userId),
      "cards"
    )) as string;
    return {
      userId,
      cards: userCards.split(","),
    };
  }

  async setAtu(atu: string | null): Promise<void> {
    const key = getRoomKey(this.roomId);
    if (!atu) {
      await this.client.hDel(key, "atu");
      return;
    }
    await this.client.hSet(key, "atu", atu);
  }

  async playCard(userId: string, card: string): Promise<void> {
    const key = getPlayedCardKey(userId);
    await this.client.set(key, card);
  }

  async endRound(): Promise<WhistGame> {
    throw new Error("Not implemented");
  }

  async checkRoundOver(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async checkGameOver(): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
