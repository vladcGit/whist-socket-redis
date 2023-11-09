import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import { getUserKey } from "./redis.service";

configDotenv();

const { SECRET } = process.env;

interface JwtPayload {
  userId: string;
}

export function serializeToken(roomId: string, username: string): string {
  const userId = getUserKey(roomId, username);
  return jwt.sign({ userId }, SECRET, { expiresIn: "1d" });
}

export function deserializeToken(token: string): string {
  try {
    const { userId } = jwt.verify(token, SECRET) as JwtPayload;

    if (!userId) {
      throw new Error("Invalid token");
    }

    return userId;
  } catch (e: any) {
    throw new Error(e);
  }
}
