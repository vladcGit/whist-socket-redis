export type WhistPlayer = {
  index: number;
  name: string;
  points: number;
  cardsLeft: number;
};

export type WhistGame = {
  id: string;
  users: WhistPlayer[];
  round: number;
  started: boolean;
  ownerId?: string;
  turn?: string;
};

export type UserCards = {
  userId: string;
  cards: string[];
};

export type RoomPlayers = {
  id: string;
  players: string[];
};
