import { Server } from "socket.io";

const listen = (io: Server) => {
  io.on("connection", (socket) => {
    let room: string;

    console.log("a user connected", socket.id);

    socket.on("playCard", (card: string) => {
      const token: string | undefined = socket.handshake.auth.token;
      if (!token) {
        throw new Error("Authentication token was not sent");
      }
      console.log(card);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client ${socket.id} disconnected: ${reason}`);
      socket.leave(room);
    });
  });
};

export default { listen };
