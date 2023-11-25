import { Grid, Text, Card, Stack } from "@mantine/core";
import { WhistGame } from "../../../lib/types";
import { useUserContext } from "../store/user-context";

type Props = {
  game: WhistGame;
  vote: (v: number) => void;
  onPlayCard: (card: string | null) => void;
};

export default function Players({ game, vote, onPlayCard }: Props) {
  const { user } = useUserContext();
  const currentUser = game?.users.find((u) => u.id === user?.id);

  if (!currentUser) {
    throw new Error("Cannot find current user");
  }

  const userWithTurn =
    game.users.find((u) => u.voted === null)?.id ||
    game.users.find((u) => !u.lastCardPlayed)?.id;

  if (!userWithTurn) {
    throw new Error("Cannot determine whose turn it is");
  }

  return (
    <Grid style={{ width: "90%" }}>
      {game?.users
        ?.sort((a, b) => a.indexThisRound - b.indexThisRound)
        ?.map((player) => {
          return (
            <Grid.Col span={{ sm: 4, xs: 12 }} key={player.id}>
              <Card
                shadow="sm"
                p="xl"
                style={{
                  backgroundColor: player.id === userWithTurn ? "#2f9e44" : "",
                }}
              >
                <Stack style={{ textAlign: "center" }}>
                  <Text size="md">{player.name}</Text>
                  {player.voted != null && (
                    <Text size="sm">{`Bidded ${player.voted}`}</Text>
                  )}
                  {player.voted != null && (
                    <Text size="sm">{`Made ${
                      player.pointsThisRound || 0
                    }`}</Text>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {player.cards
                      .split(",")
                      .filter((card) => card.length > 0)
                      .map((card, index) => (
                        <img
                          alt={card}
                          src={`/svg/${card}.svg`}
                          key={card + index}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "15vh",
                            margin: 10,
                            objectFit: "contain",
                            cursor: card !== "blank" ? "pointer" : "",
                          }}
                          onClick={() => onPlayCard(card)}
                        />
                      ))}
                  </div>
                </Stack>
              </Card>
            </Grid.Col>
          );
        })}
      {/* Every player votes */}
      {currentUser &&
        currentUser.voted === null &&
        currentUser.id === userWithTurn &&
        game.users.length > 0 && (
          <>
            <Grid.Col span={{ sm: 4, xs: 0 }} />
            <Grid.Col span={{ sm: 4, xs: 12 }}>
              <Card shadow="sm" p="xl" mt="xl">
                <Stack style={{ textAlign: "center" }}>
                  <Text size="md">
                    Please vote how many hands you think you will win
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-evenly",
                      width: "100%",
                      flexWrap: "wrap",
                    }}
                  >
                    {[...currentUser.cards.split(","), "idk"].map(
                      (_, index) => {
                        const sum = game.users
                          .map((p) => p.voted || 0)
                          .reduce((partialSum, a) => partialSum + a, 0);

                        if (
                          currentUser.indexThisRound ===
                            game.users.length - 1 &&
                          sum + index === currentUser.cards.split(",").length
                        )
                          return null;

                        return (
                          <Card
                            shadow={"sm"}
                            key={"vote" + index}
                            p="xl"
                            withBorder
                            style={{
                              cursor: "pointer",
                              marginTop: "10px",
                            }}
                            onClick={() => vote(index)}
                          >
                            <Text size="md">{index}</Text>
                          </Card>
                        );
                      }
                    )}
                  </div>
                </Stack>
              </Card>
            </Grid.Col>
          </>
        )}
    </Grid>
  );
}
