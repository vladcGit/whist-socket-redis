import { WhistGame, gameType, suite } from "../../lib/types";
import client from "../../repositories/redis.repo";
import {
  getRoomKey,
  getRoomUsersKey,
  getUserKey,
} from "./getRedisKeys.service";
import { shuffleCards } from "../shuffleCards.service";
import {
  createUser,
  getUserPublicData,
  playCard,
  updateUserForNewRound,
} from "./user.redis.service";
import { getMaximumRoundNumber } from "../whistLogic.service";

const existsRoomWithId: (roomId: string) => Promise<boolean> = async (
  roomId: string
) => {
  return (await client.exists(getRoomKey(roomId))) === 1;
};

const createGame: (roomId: string, type: gameType) => Promise<void> = async (
  roomId: string,
  type: gameType
) => {
  const id = getRoomKey(roomId);
  await client.hSet(id, {
    round: 0,
    started: 0,
    ended: 0,
    type,
    nextPlayerIndex: -1,
  });
};

const getUsersCount: (roomId: string) => Promise<number> = async (
  roomId: string
) => {
  return await client.sCard(getRoomUsersKey(roomId));
};

const addUser: (roomId: string, username: string) => Promise<void> = async (
  roomId: string,
  username: string
) => {
  const userKey = getUserKey(roomId, username);
  const previousUsersCount = await getUsersCount(roomId);
  await createUser(userKey, previousUsersCount, username);
  await client.sAdd(getRoomUsersKey(roomId), userKey);

  if (previousUsersCount === 0) {
    await client.hSetNX(getRoomKey(roomId), "ownerId", userKey);
  }
};

const getRoomOwnerId: (roomId: string) => Promise<string> = async (
  roomId: string
) => {
  const ownerId = await client.hGet(getRoomKey(roomId), "ownerId");
  if (!ownerId) {
    throw new Error("Room has no owner");
  }
  return ownerId;
};

const getRoomData: (roomId: string) => Promise<WhistGame> = async (
  roomId: string
) => {
  const room = await client.hGetAll(getRoomKey(roomId));
  const userIds = await client.sMembers(getRoomUsersKey(roomId));
  const users = await Promise.all(userIds.map((id) => getUserPublicData(id)));
  return {
    id: roomId,
    users,
    round: parseInt(room.round),
    started: parseInt(room.started) === 1,
    ended: parseInt(room.ended) === 1,
    type: room.type as gameType,
    nextPlayerIndex: parseInt(room.nextPlayerIndex),
    atu: room.atu,
    ownerId: room.ownerId,
  };
};

const setGameType: (roomId: string, type: gameType) => Promise<void> = async (
  roomId: string,
  type: gameType
) => {
  await client.hSet(getRoomKey(roomId), "type", type);
};

const setAtu: (roomId: string, atu?: string) => Promise<void> = async (
  roomId: string,
  atu: string | undefined
) => {
  if (!atu) {
    return;
  }
  await client.hSet(getRoomKey(roomId), "atu", atu);
};

const startGame: (roomId: string) => Promise<void> = async (roomId: string) => {
  await client.hSet(getRoomKey(roomId), "started", 1);
  await nextRound(roomId);
};

export const checkRoundOver: (roomId: string) => Promise<boolean> = async (
  roomId: string
) => {
  const roomData = await getRoomData(roomId);
  const usersInOrder = roomData.users.sort(
    (b, a) => b.indexThisRound - a.indexThisRound
  );
  return usersInOrder[0].lastCardPlayed !== null;
};

const nextRound: (roomId: string) => Promise<void> = async (roomId: string) => {
  await client.hIncrBy(getRoomKey(roomId), "round", 1);
  const roomData = await getRoomData(roomId);

  // todo: check if game is over
  if (getMaximumRoundNumber(roomData.users.length) < roomData.round) {
    await endGame(roomId);
    return;
  }

  // todo: get cards from whist service
  const { cards, atu } = shuffleCards(
    roomData.round,
    roomData.type,
    roomData.users.length
  );

  const userPromises: Promise<void>[] = [];

  for (let user of roomData.users) {
    let indexThisRound = user.indexThisRound;
    if (indexThisRound && indexThisRound === roomData.users.length - 1) {
      indexThisRound = 0;
    }
    if (indexThisRound && indexThisRound < roomData.users.length - 1) {
      indexThisRound++;
    }
    if (!indexThisRound) {
      indexThisRound = user.index;
    }

    userPromises.push(
      updateUserForNewRound(
        user.id,
        indexThisRound,
        cards[indexThisRound].join(",")
      )
    );
  }

  await Promise.all([...userPromises, setAtu(roomId, atu)]);
};

const endGame: (roomId: string) => Promise<void> = async (roomId: string) => {
  await client.hSet(getRoomKey(roomId), "ended", 1);
};

export {
  existsRoomWithId,
  setGameType,
  createGame,
  addUser,
  getRoomOwnerId,
  getRoomData,
  startGame,
  nextRound,
  endGame,
};
