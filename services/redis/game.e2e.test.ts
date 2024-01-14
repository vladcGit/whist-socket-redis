import client from "../../repositories/redis.repo";
import {
  addUser,
  createGame,
  getRoomData,
  playCard,
  setAtu,
  startGame,
  vote,
} from "./game.redis.service";
import { getRoomKey, getRoomUsersKey } from "./getRedisKeys.service";
import { getUserCards, getUserPublicData } from "./user.redis.service";

describe("End to end game", () => {
  let roomId = "1000";
  const roomKey = getRoomKey(roomId);
  const usersKey: string[] = [];
  const usersUniqueSetKey: string = getRoomUsersKey(roomId);

  const addPlayers = async () => {
    await addUser(roomId, "user1");
    await addUser(roomId, "user2");
    await addUser(roomId, "user3");
  };

  beforeAll(async () => {
    await client.connect();
    await createGame(roomId, "1-8-1");
    await addPlayers();
  });

  test("client should be ready", () => {
    expect(client.isReady).toBeTruthy();
  });

  test("game should be created", async () => {
    expect(await client.exists(roomKey)).toBeTruthy();
  });

  test("should be 3 players", async () => {
    const roomData = await getRoomData(roomId);
    roomData.users.forEach((user) => usersKey.push(user.id));
    expect(roomData.users.length).toBe(3);
  });

  test("should start the game", async () => {
    await startGame(roomId);
    expect(await client.hGet(roomKey, "started")).toBe("1");
  });

  test("users should have a card", async () => {
    const roomData = await getRoomData(roomId);
    for (let user of roomData.users) {
      const cards = await getUserCards(user.id);
      expect(cards.length).toEqual(1);
    }
  });

  test("users should not have any vote", async () => {
    const roomData = await getRoomData(roomId);
    for (let user of roomData.users) {
      expect(user.voted).toBeNull();
    }
  });

  test("users should not have any last card played", async () => {
    const roomData = await getRoomData(roomId);
    for (let user of roomData.users) {
      expect(user.lastCardPlayed).toBeNull();
    }
  });

  test("users should be constrained on vote", async () => {
    const roomData = await getRoomData(roomId);
    for (let user of roomData.users.slice(0, -1)) {
      await vote(roomId, user.id, 0);
    }

    const lastUser = roomData.users[roomData.users.length - 1];

    const badVoteAttempt = async () => await vote(roomId, lastUser.id, 1);

    await expect(badVoteAttempt).rejects.toThrow();
  });

  test("votes should be ok if no constraints", async () => {
    const roomData = await getRoomData(roomId);
    const firstUser = roomData.users[0];
    const secondUser = roomData.users[1];
    const lastUser = roomData.users[2];
    await vote(roomId, firstUser.id, 1);
    await vote(roomId, secondUser.id, 1);
    await vote(roomId, lastUser.id, 0);

    const lastUserData = await getUserPublicData(lastUser.id);

    await expect(lastUserData.voted).toEqual(0);

    await Promise.all([
      ...roomData.users.map((user) => client.hDel(user.id, "voted")),
    ]);
  });

  test("should get the correct score", async () => {
    let roomData = await getRoomData(roomId);
    const firstUser = roomData.users[0];
    const secondUser = roomData.users[1];
    const thirdUser = roomData.users[2];

    await setAtu(roomId, "KH");

    await client.hSet(firstUser.id, "cards", "AH");
    await client.hSet(secondUser.id, "cards", "2S");
    await client.hSet(thirdUser.id, "cards", "3S");

    expect(firstUser.indexThisRound).toEqual(0);
    expect(secondUser.indexThisRound).toEqual(1);
    expect(thirdUser.indexThisRound).toEqual(2);

    await vote(roomId, firstUser.id, 1);
    await vote(roomId, secondUser.id, 0);
    await vote(roomId, thirdUser.id, 1);

    await playCard(roomId, firstUser.id, "AH");
    await playCard(roomId, secondUser.id, "2S");
    await playCard(roomId, thirdUser.id, "3S");

    roomData = await getRoomData(roomId);

    expect(roomData.users[1].indexThisRound).toEqual(0);
    expect(roomData.users[2].indexThisRound).toEqual(1);
    expect(roomData.users[0].indexThisRound).toEqual(2);

    expect(roomData.users[0].lastCardPlayed).toBeNull();
    expect(roomData.users[1].lastCardPlayed).toBeNull();
    expect(roomData.users[2].lastCardPlayed).toBeNull();

    expect(roomData.users[0].points).toBe(6);
    expect(roomData.users[1].points).toBe(5);
    expect(roomData.users[2].points).toBe(-1);
  });

  test("should get the correct indexThisRound", async () => {
    let roomData = await getRoomData(roomId);
    const firstUser = roomData.users[0];
    const secondUser = roomData.users[1];
    const thirdUser = roomData.users[2];

    await setAtu(roomId, "KH");

    await client.hSet(firstUser.id, "cards", "AH,2D");
    await client.hSet(secondUser.id, "cards", "2S,3D");
    await client.hSet(thirdUser.id, "cards", "3S,4D");

    expect(firstUser.indexThisRound).toEqual(2);
    expect(secondUser.indexThisRound).toEqual(0);
    expect(thirdUser.indexThisRound).toEqual(1);

    await vote(roomId, firstUser.id, 1);
    await vote(roomId, secondUser.id, 0);
    await vote(roomId, thirdUser.id, 0);

    await playCard(roomId, secondUser.id, "2S");
    await playCard(roomId, thirdUser.id, "3S");
    await playCard(roomId, firstUser.id, "AH");

    roomData = await getRoomData(roomId);

    expect(roomData.users[0].indexThisRound).toEqual(0);
    expect(roomData.users[1].indexThisRound).toEqual(1);
    expect(roomData.users[2].indexThisRound).toEqual(2);
  });

  afterAll(async () => {
    const promises = [roomKey, usersUniqueSetKey, ...usersKey].map((key) =>
      client.del(key)
    );
    await Promise.all(promises);

    await client.disconnect();
  });
});
