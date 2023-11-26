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
  playCard as userPlayCard,
  updateUserForNewRound,
  vote as updateUserVote,
  updateUserScoreThisRound,
  updateUserPoints,
  setUserLastPlayedCard,
  resetUserScoreThisRound,
  getUserCards,
} from "./user.redis.service";
import {
  determineWinner,
  getMaximumRoundNumber,
  isValidVote,
} from "../whistLogic.service";

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

const vote = async (
  roomId: string,
  userId: string,
  vote: number
): Promise<void> => {
  const room = await getRoomData(roomId);
  if (!room.started) {
    throw new Error("Game has not started yet");
  }

  if (room.ended) {
    throw new Error("Game has ended");
  }

  if (room.users.find((u) => u.id === userId)?.voted) {
    throw new Error("You have already voted");
  }

  const isLastPlayer =
    room.users.find((u) => u.id === userId)?.indexThisRound ===
    room.users.length - 1;

  const sumOfPrevVotes = room.users
    .map((user) => user.voted)
    .reduce((a, b) => (a || 0) + (b || 0), 0);

  if (
    !isValidVote(
      isLastPlayer,
      room.users[0].cards.split(",").length,
      sumOfPrevVotes || 0,
      vote
    )
  ) {
    throw new Error("This vote is not valid");
  }

  return updateUserVote(userId, vote);
};

const playCard: (
  //todo: check if card can be played (same suite or atu)
  roomId: string, //todo: the player who wins the round is first to play (see how you can implement that and retain position at the start of the round)
  userId: string,
  card: string
) => Promise<void> = async (roomId: string, userId: string, card: string) => {
  let room = await getRoomData(roomId);

  if (!room.started) {
    throw new Error("Game has not started yet");
  }

  if (room.ended) {
    throw new Error("Game has ended");
  }

  const currentUser = room.users.find((u) => u.id === userId);
  if (!currentUser) {
    throw new Error("This user does not exist");
  }

  const currentUserCards = await getUserCards(userId);

  if (currentUserCards.length === 0) {
    throw new Error("You have no cards");
  }

  const firstCardPlayed = room.users.find(
    (u) => u.indexThisRound === 0
  )?.lastCardPlayed;

  if (firstCardPlayed) {
    const firstSuite = firstCardPlayed[1];
    const atuSuite = room.atu ? room.atu[1] : null;
    const playerSuites = currentUserCards.map((c) => c[1]);

    if (playerSuites.includes(firstSuite) && card[1] !== firstSuite) {
      throw new Error(
        "You must play a card of the same suite as the first card played"
      );
    }

    if (
      card[1] !== firstSuite &&
      atuSuite &&
      playerSuites.includes(atuSuite) &&
      card[1] !== atuSuite
    ) {
      throw new Error("You must play a card of the same suite as the ATU");
    }
  }

  await userPlayCard(userId, card);

  room = await getRoomData(roomId);

  if (room.users.some((user) => !user.lastCardPlayed)) {
    return;
  }

  const winnerIndex = determineWinner(room);
  const winnerId = room.users.find((user) => user.index === winnerIndex)?.id;
  if (!winnerId) {
    throw new Error("No winner");
  }
  await updateUserScoreThisRound(winnerId, 1);
  await Promise.all(
    room.users.map((user) => setUserLastPlayedCard(user.id, null))
  );

  room = await getRoomData(roomId);

  if (room.users.every((user) => user.cards.length === 0)) {
    const promisesArray: Promise<void>[] = [];
    for (let user of room.users) {
      const score =
        user.pointsThisRound === user.voted
          ? user.voted + 5
          : -Math.abs(user.voted || 0 - user.pointsThisRound);
      promisesArray.push(updateUserPoints(user.id, score)); // todo: it's probably not correct
      // todo: on games of 3 it's not calculated correctly
    }

    await Promise.all(promisesArray);
    await nextRound(roomId);
  }
};

const nextRound: (roomId: string) => Promise<void> = async (roomId: string) => {
  await client.hIncrBy(getRoomKey(roomId), "round", 1);
  const roomData = await getRoomData(roomId);

  // reset data for each user
  await Promise.all([
    ...roomData.users.map((user) => setUserLastPlayedCard(user.id, null)),
    ...roomData.users.map((user) => resetUserScoreThisRound(user.id)),
  ]);

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
    const validIndex = !Number.isNaN(indexThisRound);
    if (validIndex && indexThisRound === 0) {
      indexThisRound = roomData.users.length - 1;
    } else if (validIndex && indexThisRound > 0) {
      indexThisRound--;
    } else {
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
  setAtu,
  vote,
  playCard,
  nextRound,
  endGame,
};
