import { io } from "socket.io-client";

export const socket = io("localhost:80", {
  auth: {
    token: "abc",
  },
});
