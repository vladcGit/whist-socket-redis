import { WhistPlayer } from "../../lib/types";
import client from "../../repositories/redis.repo";

const getUserCompleteData: (userId: string) => Promise<WhistPlayer> = async (
  userId: string
) => {
  const user = await client.hGetAll(userId);
  return {
    id: userId,
    index: parseInt(user.index),
    indexThisRound: parseInt(user.indexThisRound),
    name: user.name,
    points: parseInt(user.points),
    voted: parseInt(user.voted) || null,
    cards: user.cards,
    lastCardPlayed: user.lastCardPlayed,
  };
};

const createUser: (
  userId: string,
  index: number,
  name: string
) => Promise<void> = async (userId: string, index: number, name: string) => {
  await client.hSet(userId, {
    id: userId,
    index,
    name,
    points: 0,
    cards: "",
  });
};

const getUserPublicData: (userId: string) => Promise<WhistPlayer> = async (
  userId: string
) => {
  const user = await getUserCompleteData(userId);
  const blankCards = user.cards
    .split(",")
    .map((card) => {
      return "blank";
    })
    .join(",");
  user.cards = blankCards;
  return user;
};

export const getUserCards: (userId: string) => Promise<string[]> = async (
  userId: string
) => {
  const userCards = (await client.hGet(userId, "cards")) as string;
  return userCards.split(",");
};

const setUserCards: (userId: string, cards: string) => Promise<void> = async (
  userId: string,
  cards: string
) => {
  await client.hSet(userId, "cards", cards);
};

export const playCard: (userId: string, card: string) => Promise<void> = async (
  userId: string,
  card: string
) => {
  const cards = await getUserCards(userId);
  if (!cards.includes(card)) {
    throw new Error("Card not found");
  }
  const newCards = cards.filter((c) => c !== card);

  await setUserCards(userId, newCards.join(","));
  await setUserLastPlayedCard(userId, card);
};

const vote: (userId: string, vote: number) => Promise<void> = async (
  userId: string,
  vote: number
) => {
  await client.hSet(userId, "voted", vote);
};

const getUserLastPlayedCard: (userId: string) => Promise<string> = async (
  userId: string
) => {
  const card = (await client.hGet(userId, "lastCardPlayed")) as string;
  return card;
};

const setUserLastPlayedCard: (
  userId: string,
  card: string | null
) => Promise<void> = async (userId: string, card: string | null) => {
  if (!card) {
    await client.hDel(userId, "lastCardPlayed");
    return;
  }
  await client.hSet(userId, "lastCardPlayed", card);
};

const updateUserPoints: (
  userId: string,
  pointsLastRound: number
) => Promise<void> = async (userId: string, pointsLastRound: number) => {
  await client.hIncrBy(userId, "points", pointsLastRound);
};

const updateUserForNewRound: (
  userId: string,
  indexThisRound: number,
  cards: string
) => Promise<void> = async (
  userId: string,
  indexThisRound: number,
  cards: string
) => {
  await Promise.all([
    client.hSet(userId, {
      indexThisRound,
      cards,
    }),
    client.hDel(userId, "voted"),
    client.hDel(userId, "lastCardPlayed"),
  ]);
};

export {
  createUser,
  getUserCompleteData,
  getUserPublicData,
  updateUserForNewRound,
};
