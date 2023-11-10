export enum suitesEnum {
  H = "Hearts",
  D = "Diamonds",
  S = "Spades",
  C = "Clubs",
}
export type suite = keyof typeof suitesEnum;

export enum faceCardsEnum {
  A = "Ace",
  K = "King",
  Q = "Queen",
  J = "Jack",
  T = "Ten",
}

export type faceCard = keyof typeof faceCardsEnum;

export type gameType = "1-8-1" | "8-1-8";

export type WhistPlayer = {
  id: string;
  index: number;
  name: string;
  points: number;
  cardsLeft: number;
  voted: number;
};

export type WhistGame = {
  id: string;
  users: WhistPlayer[];
  round: number;
  started: boolean;
  type: gameType;
  nextPlayerIndex: number;
  atu?: suite;
  ownerId?: string;
  firstPlayerIndex: number;
};

export type UserCards = {
  userId: string;
  cards: string[];
};

export type RoomPlayers = {
  id: string;
  players: string[];
};

export type PlayedCards = {
  id: string;
  card: string;
};
