import { Server } from "socket.io";

const listen = (io: Server) => {
  const whistNamespace = io.of("/whist");

  whistNamespace.on("connection", (socket) => {
    let room: string;

    console.log("a user connected", socket.id);

    socket.on("disconnect", (reason) => {
      console.log(`Client ${socket.id} disconnected: ${reason}`);
      socket.leave(room);
    });
  });
};

export default { listen };
