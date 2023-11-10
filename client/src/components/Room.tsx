import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import { useSocket } from "../hooks/useSocket";
import Cookies from "js-cookie";

export default function Room() {
  const { id } = useParams();
  if (!id) {
    throw new Error("The id of the room is not defined");
  }
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log(id);
    function onConnect() {
      console.log("connected");
      console.log(socket.id);
    }

    const cookie = Cookies.get("Authorization") as string;
    const socket = useSocket(id, cookie);
    socket.on("connect", onConnect);
    socket.connect();
    setSocket(socket);

    return () => {
      socket.off("connect", onConnect);
      socket.disconnect();
    };
  }, []);
  return <div>Room</div>;
}
