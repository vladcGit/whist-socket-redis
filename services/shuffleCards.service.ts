import RedisService from "./redis.service";

const shuffleStrategyOneEightOne = (round: number, numberOfPlayers: number) => {
  let numberOfCards: number;

  // first games of 1
  if (round / numberOfPlayers <= 1) numberOfCards = 1;
  // first round of games between 2 and 7
  else if (round >= numberOfPlayers + 1 && round <= numberOfPlayers + 6)
    numberOfCards = round - numberOfPlayers + 1;
  // games of 8
  else if (round >= numberOfPlayers + 7 && round <= 2 * numberOfPlayers + 6)
    numberOfCards = 8;
  // second round of games between 2 and 7
  else if (
    round >= 2 * numberOfPlayers + 7 &&
    round <= 2 * numberOfPlayers + 12
  )
    numberOfCards = 2 * numberOfPlayers + 14 - round;
  // last game of 1
  else numberOfCards = 1;

  return numberOfCards;
};

const strategyEightOneEight = (round: number, numberOfPlayers: number) => {
  let numberOfCards: number;

  // first games of 8
  if (round / numberOfPlayers <= 1) numberOfCards = 8;
  // first games between 2 and 7
  else if (round >= numberOfPlayers + 1 && round <= numberOfPlayers + 6)
    numberOfCards = 8 - (round - numberOfPlayers);
  // first games of 1
  else if (round >= numberOfPlayers + 7 && round <= 2 * numberOfPlayers + 6)
    numberOfCards = 1;
  // second round of games between 2 and 7
  else if (
    round >= 2 * numberOfPlayers + 7 &&
    round <= 2 * numberOfPlayers + 12
  )
    numberOfCards = round - 2 * numberOfPlayers - 5;
  // the last game of 8
  else numberOfCards = 8;

  return numberOfCards;
};

const randomShuffle = (deck: string[]) => {
  let i = deck.length,
    k,
    temp;
  while (--i > 0) {
    k = Math.floor(Math.random() * (i + 1));
    temp = deck[k];
    deck[k] = deck[i];
    deck[i] = temp;
  }
};

export const shuffleCards = async (roomId: string) => {
  let deck = [
    "2H",
    "2S",
    "2C",
    "2D",
    "3H",
    "3S",
    "3C",
    "3D",
    "4H",
    "4S",
    "4C",
    "4D",
    "5H",
    "5S",
    "5C",
    "5D",
    "6H",
    "6S",
    "6C",
    "6D",
    "7H",
    "7S",
    "7C",
    "7D",
    "8H",
    "8S",
    "8C",
    "8D",
    "9H",
    "9S",
    "9C",
    "9D",
    "TH",
    "TS",
    "TC",
    "TD",
    "JH",
    "JS",
    "JC",
    "JD",
    "QH",
    "QS",
    "QC",
    "QD",
    "KH",
    "KS",
    "KC",
    "KD",
    "AH",
    "AS",
    "AC",
    "AD",
  ];

  const redisService = new RedisService(roomId);
  const room = await redisService.getPublicData();
  const players = room.users;

  const numberOfPlayers = players.length;

  // elimina carti in functie de cati jucatori sunt
  deck = deck.slice(-numberOfPlayers * 8);

  //vezi cate carti trebuie impartite
  const round = room.round;
  const type = room.type;
  let numberOfCards: number;
  if (type === "1-8-1") {
    numberOfCards = shuffleStrategyOneEightOne(round, numberOfPlayers);
  } else {
    numberOfCards = strategyEightOneEight(round, numberOfPlayers);
  }

  // shuffle deck and deal to players
  randomShuffle(deck);
  for (let player of players) {
    const playerCards = [];
    for (let i = 0; i < numberOfCards; i++) {
      playerCards.push(deck.pop());
    }
    await redisService.dealToPlayer(player.id, playerCards.join(","));
  }

  if (numberOfCards !== 8) {
    await redisService.setAtu(deck.pop() as string);
  } else {
    await redisService.setAtu(null);
  }
  console.log(numberOfCards);
};
