import { faceCard, faceCardsEnum, suite } from "../lib/types";

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
