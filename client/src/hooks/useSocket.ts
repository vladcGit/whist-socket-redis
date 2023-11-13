import { io } from "socket.io-client";

export const useSocket = (roomId: string, token: string) => {
  return io({
    auth: {
      token,
      roomId,
    },
  });
};
