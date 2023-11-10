import {
  PlayedCards,
  WhistGame,
  faceCard,
  faceCardsEnum,
  suite,
} from "../lib/types";
import RedisService from "./redis.service";

export const isValidNumberOfPlayers = (noOfPlayers: number) => {
  return noOfPlayers >= 3 && noOfPlayers <= 6;
};

const getCardValue = (card: string) => {
  const value = card[0];
  if (Number.isInteger(value)) {
    return value;
  }
  const faceValue = faceCardsEnum[value as faceCard];
  if (!faceValue) {
    throw new Error("Invalid Card");
  }
};

const compareCards = (
  a: string,
  b: string,
  firstSuite: suite,
  atu: suite | null = null
) => {
  if (atu) {
    if (a[1] === atu[1] && b[1] !== atu[1]) return -1;
    else if (a[1] !== atu[1] && b[1] === atu[1]) return 1;
  }

  if (a[1] === firstSuite[0] && b[1] !== firstSuite[0]) return -1;
  else if (a[1] !== firstSuite[0] && b[1] === firstSuite[0]) return 1;

  if (a[0] === "A") return -1;
  if (b[0] === "A") return 1;

  if (a[0] === "K") return -1;
  if (b[0] === "K") return 1;

  if (a[0] === "Q") return -1;
  if (b[0] === "Q") return 1;

  if (a[0] === "J") return -1;
  if (b[0] === "J") return 1;

  if (a[0] === "T") return -1;
  if (b[0] === "T") return 1;

  return a.charCodeAt(0) > b.charCodeAt(0) ? -1 : 1;
};

const determineWinner = async (
  room: WhistGame,
  playedCards: PlayedCards[]
): Promise<number> => {
  const redisService = new RedisService(room.id);

  // get the order of the players this turn (by index assigned at room creation)
  const indexes: number[] = [];
  const numberOfPlayers = await redisService.getNumberOfPlayers();

  for (let i = room.firstPlayerIndex; i < numberOfPlayers; i++) {
    indexes.push(i);
  }
  for (let i = 0; i < room.firstPlayerIndex; i++) {
    indexes.push(i);
  }

  const playersInOrder = indexes.map(
    (index) => room.users.find((user) => user.index === index)?.id as string
  );

  const cards = await Promise.all(
    playersInOrder.map((playerId) => redisService.getCardPlayedByUser(playerId))
  );

  const cardsWithPlayerIndex = cards.map((card, index) => ({
    card: card,
    index: indexes[index],
  }));

  cardsWithPlayerIndex.sort((obj1, obj2) =>
    compareCards(obj1.card, obj2.card, cards[1] as suite, room.atu)
  );

  return cardsWithPlayerIndex[0].index;
};
