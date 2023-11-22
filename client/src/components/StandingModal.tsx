import { useState } from "react";
import { Modal, Button, Group } from "@mantine/core";
import { WhistGame } from "../../../lib/types";

import classes from "./StandingModal.module.css";

type Props = {
  game: WhistGame;
};

export default function StandingModal({ game }: Props) {
  const [opened, setOpened] = useState(false);
  const playersCopy = [...game.users];
  playersCopy.sort((a, b) => b.points - a.points);

  return (
    <>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Standings">
        <>
          {playersCopy.map((player, index) => (
            <Group justify="center" key={player.id}>
              {`${index + 1}. ${player.name} ${player.points || 0}`}
            </Group>
          ))}
        </>
      </Modal>

      <Group justify="center" className={classes.openModalButton}>
        <Button onClick={() => setOpened(true)} color={"gray"}>
          Standings
        </Button>
      </Group>
    </>
  );
}
