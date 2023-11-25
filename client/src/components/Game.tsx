import { useState, useEffect, useReducer } from "react";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import { WhistGame } from "../../../lib/types";
import { Divider, Skeleton, Text } from "@mantine/core";
import { useUserContext } from "../store/user-context";
import StandingModal from "./StandingModal";
import classes from "./Game.module.css";
import Players from "./Players";
import { socket } from "../lib/socket";

export default function Game() {
  const { id } = useParams();
  if (!id) {
    throw new Error("The id of the room is not defined");
  }

  const cookie = Cookies.get("Authorization");
  const { user } = useUserContext();

  const [game, setGame] = useState<WhistGame | null>(null);
  const [socketEventsReady, setSocketEventsReady] = useState(false);

  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  // if (socket.connected && socketEventsReady) {
  //   socket.emit("getPublicData");
  // }

  if (cookie && !socket.connected && socketEventsReady) {
    socket.auth = {
      token: cookie,
    };
    socket.connect();
  }

  useEffect(() => {
    if (socket.connected && socketEventsReady) {
      socket.emit("getPublicData");
    }
  }, [socketEventsReady]);

  useEffect(() => {
    if (!user) {
      return;
    }
    function onConnect() {
      console.log(socket.id);
      socket.emit("getPublicData");
    }

    function onGetPublicData(data: WhistGame) {
      setGame(data);
      socket.emit("whatAreMyCards");
      forceUpdate();
    }

    function onGetPrivateCards(data: string) {
      console.log(data);
      setGame((oldGame) => {
        if (user && oldGame) {
          const userIndex = oldGame?.users
            .map((u) => u.id)
            .indexOf(user.id as string);
          oldGame.users[userIndex].cards = data;
        }
        return oldGame;
      });
      forceUpdate();
    }

    function onPlayerVoted({ userId, vote }: { userId: string; vote: number }) {
      console.log(userId, vote);
      setGame((oldGame) => {
        if (user && oldGame) {
          const userIndex = oldGame?.users.map((u) => u.id).indexOf(userId);
          oldGame.users[userIndex].voted = vote;
        }
        return oldGame;
      });
      forceUpdate();
    }

    socket.on("connect", onConnect);
    socket.on("publicData", onGetPublicData);
    socket.on("yourCards", onGetPrivateCards);
    socket.on("vote", onPlayerVoted);

    setSocketEventsReady(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("publicData", onGetPublicData);
      socket.off("yourCards", onGetPrivateCards);
      socket.off("vote", onPlayerVoted);
    };
  }, [user]);

  const playCard = (card: string | null) => {
    if (!card || card === "blank") {
      return;
    }
    socket?.emit("playedCard", card);
  };

  const vote = (v: number) => {
    socket?.emit("vote", v);
  };

  const cards =
    game?.users
      .sort((a, b) => a.indexThisRound - b.indexThisRound)
      .map((u) => u.lastCardPlayed)
      .filter((c) => c) || [];

  return (
    <>
      {game && <StandingModal game={game} />}
      {user && game && !game.ended && (
        <div style={{ minHeight: "100vh" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "start",
              alignItems: "center",
            }}
          >
            {game.atu ? (
              <>
                <Text className={classes.description}>Trump card:</Text>
                <img
                  alt={"Trump card"}
                  src={`/svg/${game.atu}.svg`}
                  className={classes.image}
                />
                <Divider my="xl" className={classes.divider} />
              </>
            ) : (
              <div style={{ height: "10vh" }} />
            )}
            <Players game={game} vote={vote} onPlayCard={playCard} />
            <Divider my="xl" className={classes.divider} />
            <Text size="md">Community cards</Text>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              {cards.map((card) => (
                <img
                  alt={card || ""}
                  key={card}
                  src={`/svg/${card}.svg`}
                  className={classes.image}
                  style={{ margin: "30px" }}
                />
              ))}
              {Array.apply(null, Array(game.users.length - cards.length)).map(
                (_, index) => (
                  <div style={{ margin: "30px" }} key={`skeleton ${index}`}>
                    <Skeleton radius="md" className={classes.skeleton}>
                      <img
                        alt=""
                        className={classes.image}
                        src={`/svg/blank.svg`}
                        style={{ margin: 0 }}
                      />
                    </Skeleton>
                  </div>
                )
              )}
            </div>
            <Divider my="xl" className={classes.divider} />
          </div>
        </div>
      )}
    </>
  );
}
