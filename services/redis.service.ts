import { createClient } from "redis";
import { configDotenv } from "dotenv";
import {
  PlayedCards,
  UserCards,
  WhistGame,
  WhistPlayer,
  gameType,
  suite,
} from "../lib/types";
import { isValidNumberOfPlayers } from "./whistLogic.service";

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
      nextPlayerIndex: 0,
      firstPlayerIndex: 0,
      started: 0,
    });

    return {
      id,
      users: [],
      round: 1,
      started: false,
      type,
      nextPlayerIndex: 0,
      firstPlayerIndex: 0,
    };
  }

  async addUserToGame(username: string): Promise<void> {
    const roomUsersKey = getRoomUsersKey(this.roomId);
    const newUserKey = getUserKey(this.roomId, username);

    const numberOfPlayers = await this.client.sCard(roomUsersKey);

    if (await this.client.sIsMember(roomUsersKey, newUserKey)) {
      throw new Error("A user with this name already exists in this room");
    }

    if (numberOfPlayers === 6) {
      throw new Error("The number of users is the maximum allowed - 6");
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

    const userIds = await this.client.sMembers(getRoomUsersKey(this.roomId));

    if (!isValidNumberOfPlayers(userIds.length)) {
      throw new Error("The number of players must be between 3 and 6");
    }

    await this.client.hSet(roomKey, "started", 1);
    // todo: whist service to give everyone cards
  }

  static async getUserData(userId: string): Promise<WhistPlayer> {
    const user = await RedisService.clientInstance.hGetAll(userId);
    return {
      id: user.id,
      index: parseInt(user.index),
      name: user.name,
      points: parseInt(user.points),
      cardsLeft: parseInt(user.cardsLeft),
      voted: parseInt(user.voted),
    };
  }

  async getUsersData(): Promise<WhistPlayer[]> {
    const userIds = await this.client.sMembers(getRoomUsersKey(this.roomId));
    const users = await Promise.all(
      userIds.map((userId) => RedisService.getUserData(userId))
    );
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
      nextPlayerIndex: parseInt(roomData.nextPlayerIndex),
      ownerId: roomData.ownerId,
      firstPlayerIndex: parseInt(roomData.firstPlayerIndex),
      atu: roomData.data as suite,
    };
  }

  async getRoomOwnerId() {
    const owner = await this.client.hGet(this.roomId, "ownerId");
    return owner;
  }

  async modifyGameType(type: gameType) {
    await this.client.hSet(this.roomId, "type", type);
  }

  async dealToPlayer(userId: string, cards: string) {
    await this.client.hSet(getUserCardsKey(userId), "cards", cards);
  }

  async getUserCards(userId: string): Promise<UserCards> {
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

  async getCardPlayedByUser(userId: string): Promise<string> {
    const key = getPlayedCardKey(userId);
    const card = (await this.client.get(key)) as string;
    if (!card) {
      throw new Error("The user has not played any card this round");
    }
    return card;
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

  async getPlayedCards(): Promise<PlayedCards[]> {
    const players = await this.client.sMembers(getRoomUsersKey(this.roomId));
    const promises = players.map((player) =>
      this.client.get(getUserCardsKey(player))
    );

    const cards = await Promise.all(promises);

    const result: PlayedCards[] = [];
    for (let i = 0; i < players.length; i++) {
      result.push({ id: players[i], card: cards[i] as string });
    }

    return result;
  }

  async getNumberOfPlayers(): Promise<number> {
    return await this.client.sCard(getRoomUsersKey(this.roomId));
  }
}
