import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import Cookies from "js-cookie";
import { WhistGame } from "../../../lib/types";
import {
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Grid,
  Group,
  Radio,
  RadioGroup,
  Skeleton,
  Text,
} from "@mantine/core";
import { useUserContext } from "../store/user-context";
import classes from "./Room.module.css";

export default function Room() {
  const { id } = useParams();
  if (!id) {
    throw new Error("The id of the room is not defined");
  }

  const [game, setGame] = useState<WhistGame | null>(null);

  const { user } = useUserContext();

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

    socket.emit("newPlayer");
    socket.on("newPlayer", (data: WhistGame) => {
      console.log(data);
      setGame(data);
    });

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  const handleStartGame = () => {}; // todo

  const handleModifyGameType = () => {}; // todo

  return (
    <div className={classes.wrapper}>
      <Container size={700} className={classes.inner}>
        <h1 className={classes.title}>
          Share the code with your friends and when you are ready press start
        </h1>
        <h1 className={classes.description}>The code is: {id}</h1>
        {game && user?.id === game.ownerId && (
          <>
            <Button variant="filled" size="lg" onClick={handleStartGame}>
              Start
            </Button>
            <Divider my="xl" />
            <Checkbox
              checked={true}
              onChange={(event) => console.log(event.currentTarget.checked)}
              size="xl"
              label="Play with your card unseen on games of one"
            />
            <Divider my="xl" />
            <RadioGroup
              value={game?.type}
              onChange={handleModifyGameType}
              label="Select game type"
              size="xl"
            >
              <Radio value="1-8-1" label="1-8-1" />
              <Radio value="8-1-8" label="8-1-8" />
            </RadioGroup>
          </>
        )}
      </Container>
      <Container mt="md" className={classes["player-container"]}>
        <Grid>
          {game &&
            game.users
              .sort((a, b) => a.index - b.index)
              .map((player) => (
                <Grid.Col span={4} key={player.id}>
                  <Card shadow="sm" p="xl">
                    <Group>
                      <Text fw={500} size="xl">
                        {player.name}
                      </Text>
                    </Group>
                    <Group>
                      <Text mt="10px" size="xl" style={{ lineHeight: 1.5 }}>
                        {player.index + 1}
                      </Text>
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
          {!game && (
            <>
              <Grid.Col span={4}>
                <Skeleton visible={true} height={150} />
              </Grid.Col>
              <Grid.Col span={4}>
                <Skeleton visible={true} height={150} />
              </Grid.Col>
              <Grid.Col span={4}>
                <Skeleton visible={true} height={150} />
              </Grid.Col>
            </>
          )}
        </Grid>
      </Container>
    </div>
  );
}
