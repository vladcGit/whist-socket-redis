import { WhistGame, suite } from "../lib/types";

const compareCards = (a: string, b: string) => {
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

  const cardsWithPlayerIndex = room.users
    .sort((u1, u2) => u1.indexThisRound - u2.indexThisRound)
    .map((user) => ({
      indexThisRound: user.indexThisRound,
      card: user.lastCardPlayed as string,
    }));

  const firstPlayerCard = cardsWithPlayerIndex[0].card;
  if (!firstPlayerCard) {
    throw new Error("No card has been played this round");
  }

  if (cardsWithPlayerIndex.some((user) => !user.card)) {
    throw new Error("An user has not played a card this round");
  }

  if (room.atu) {
    const atuCards = cardsWithPlayerIndex.filter(
      (x) => x.card[1] === (room.atu as string)[1]
    );
    if (atuCards.length > 0) {
      atuCards.sort((a, b) => compareCards(a.card, b.card));
      return atuCards[0].indexThisRound;
    }
  }

  const cardsWithSuite = cardsWithPlayerIndex.filter(
    (x) => x.card[1] === firstPlayerCard[1]
  );
  cardsWithSuite.sort((a, b) => compareCards(a.card, b.card));
  return cardsWithSuite[0].indexThisRound;
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
