import { Container, Text, Button, Input } from "@mantine/core";
import classes from "./Homepage.module.css";
import { useEffect, useState } from "react";
import updateGradient from "../lib/gradient";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import customNotification from "../lib/customNotification";
import { useUserContext } from "../store/user-context";
import fetchUser from "../lib/fetch-user";

export default function Homepage() {
  const navigate = useNavigate();
  const { setUser } = useUserContext();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(updateGradient, 10);
    return () => clearInterval(timer);
  }, []);

  const handleCreateRoom = async () => {
    try {
      if (name.length <= 3) {
        return customNotification(
          "Validation error",
          "You need to provide a name with at least 3 letters"
        );
      }
      setLoading(true);
      const res = await axios.post("/api/new-game", { username: name });
      const roomId: string = res.data.roomId;
      const user = await fetchUser();
      setUser(user);
      navigate(`/room/${roomId}`);
    } catch (e: any) {
      customNotification("An error occured", e.response.data.error);
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    try {
      if (name.length <= 3) {
        return customNotification(
          "Validation error",
          "You need to provide a name with at least 3 letters"
        );
      }
      setLoading(true);
      await axios.post(`/api/join-game/${code}`, { username: name });
      const user = await fetchUser();
      setUser(user);
      navigate(`/room/${code}`);
    } catch (e: any) {
      customNotification("An error occured", e.response.data.error);
      setLoading(false);
    }
  };

  return (
    <>
      <div id="gradient"></div>
      <div
        className={classes.wrapper}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <Container size={700}>
          <h1 className={classes.title}>
            Play{" "}
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
              inherit
            >
              Whist
            </Text>{" "}
            with your friends for free
          </h1>

          <Text className={classes.description} mt="60px" mb="30px">
            First enter your name:
          </Text>
          <Input
            placeholder="your name..."
            mb="60px"
            size="lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Text className={classes.description} mb="30px" mt="30px">
            then create a new game...
          </Text>
          <Button
            variant="filled"
            className={classes.control}
            onClick={handleCreateRoom}
            size="xl"
            loading={loading}
          >
            Create
          </Button>
          <Text className={classes.description} mb="30px" mt="40px">
            ...or join an existing game
          </Text>
          <Input
            placeholder="code..."
            type="number"
            mb="30px"
            size="lg"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            variant="filled"
            size="xl"
            className={classes.control}
            loading={loading}
            onClick={handleJoinRoom}
          >
            Join
          </Button>
        </Container>
      </div>
    </>
  );
}
