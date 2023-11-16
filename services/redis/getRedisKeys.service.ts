const getUserKey = (roomId: string, username: string): string => {
  return `room#${roomId}:user#${username}`;
};

// key for a set with all the unique users in a room
const getRoomUsersKey = (roomId: string): string => {
  return `room#${roomId}:users:unique`;
};

// key for a room (whist game)
const getRoomKey = (roomId: string): string => {
  return `room#${roomId}`;
};

const getUserCardsKey = (userId: string): string => {
  return `${userId}:cards`;
};

const getPlayedCardKey = (userId: string): string => {
  return `${userId}:played-card`;
};

export {
  getUserKey,
  getRoomUsersKey,
  getRoomKey,
  getUserCardsKey,
  getPlayedCardKey,
};
