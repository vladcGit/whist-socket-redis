import { WhistGame, suite } from "../lib/types";

const compareCards = (
  a: string,
  b: string,
  firstSuite: suite,
  atu: string | null = null
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

export const determineWinner = (room: WhistGame): number => {
  // get the order of the players this turn (by index assigned at room creation)

  room.users.sort((a, b) => a.indexThisRound - b.indexThisRound);
  const firstPlayerCard = room.users[0].lastCardPlayed;
  if (!firstPlayerCard) {
    throw new Error("No card has been played this round");
  }
  const cardsWithPlayerIndex = room.users.map((user) => ({
    index: user.indexThisRound,
    card: user.lastCardPlayed,
  }));

  if (cardsWithPlayerIndex.some((user) => !user.card)) {
    throw new Error("An user has not played a card this round");
  }

  cardsWithPlayerIndex.sort((a, b) =>
    compareCards(
      a.card as string,
      b.card as string,
      firstPlayerCard[1] as suite,
      room.atu
    )
  );

  return cardsWithPlayerIndex[0].index;
};

export const getValidNumberOfPlayers: () => [number, number] = () => {
  return [3, 6];
};

export const getMaximumRoundNumber = (noOfPlayers: number) => {
  return noOfPlayers * 3 + 12;
};

export const isValidVote = (
  isLastPlayer: boolean,
  numberOfCards: number,
  sumOfPrevVotes: number,
  vote: number
) => {
  if (!isLastPlayer) {
    return true;
  }

  return vote + sumOfPrevVotes !== numberOfCards;
};
