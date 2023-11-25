import { WhistPlayer } from "../../lib/types";
import client from "../../repositories/redis.repo";
import {
  addUser,
  createGame,
  getRoomData,
  setAtu,
  startGame,
  playCard,
} from "./game.redis.service";
import {
  getRoomKey,
  getRoomUsersKey,
  getUserKey,
} from "./getRedisKeys.service";
import { setUserCards } from "./user.redis.service";

describe("Game unit tests", () => {
  const roomId = "10000";

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await createGame(roomId, "1-8-1");
    await addUser(roomId, "user1");
    await addUser(roomId, "user2");
    await addUser(roomId, "user3");

    await startGame(roomId);
  });

  test("game should be started and with 3 players", async () => {
    const roomData = await getRoomData(roomId);
    expect(roomData.started).toEqual(true);
    expect(roomData.users.length).toEqual(3);
  });

  test(
    "should not play an invalid suite",
    async () => {
      await client.hSet(getRoomKey(roomId), "round", 2);
      await setAtu(roomId, "AH");
      await setUserCards(getUserKey(roomId, "user1"), "AD,KD");
      await setUserCards(getUserKey(roomId, "user2"), "QD,KH");
      await setUserCards(getUserKey(roomId, "user3"), "JH,9C");

      await playCard(roomId, getUserKey(roomId, "user1"), "AD");

      await expect(
        async () => await playCard(roomId, getUserKey(roomId, "user2"), "KH")
      ).rejects.toThrow();

      await playCard(roomId, getUserKey(roomId, "user2"), "QD");

      await expect(
        async () => await playCard(roomId, getUserKey(roomId, "user3"), "9C")
      ).rejects.toThrow();
    },
    1000 * 60 * 60
  );

  afterEach(async () => {
    const promises = [
      getRoomKey(roomId),
      getRoomUsersKey(roomId),
      getUserKey(roomId, "user1"),
      getUserKey(roomId, "user2"),
      getUserKey(roomId, "user3"),
    ].map((key) => client.del(key));
    await Promise.all(promises);
  });

  afterAll(async () => {
    await client.disconnect();
  });
});
