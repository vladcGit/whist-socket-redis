import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import { WhistGame } from "../../../lib/types";
import { Socket } from "socket.io-client";
import { useUserContext } from "../store/user-context";
import { useSocket } from "../hooks/useSocket";
import StandingModal from "./StandingModal";

export default function Game() {
  const { id } = useParams();
  if (!id) {
    throw new Error("The id of the room is not defined");
  }

  const [game, setGame] = useState<WhistGame | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { user } = useUserContext();

  useEffect(() => {
    console.log(id);

    function onConnect() {
      console.log("connected");
      console.log(socket.id);
    }

    function onGetPublicData(data: WhistGame) {
      console.log(data);
      setGame(data);
    }

    const cookie = Cookies.get("Authorization") as string;
    const socket = useSocket(id, cookie);
    setSocket(socket);
    socket.on("connect", onConnect);
    socket.on("publicData", onGetPublicData);

    socket.connect();
    socket.emit("getPublicData");

    return () => {
      socket.off("connect", onConnect);
      socket.off("publicData", onGetPublicData);
    };
  }, []);

  return <>{game && <StandingModal game={game} />}</>;

  // return (
  //   <>
  //     {game && <StandingModal game={game} />}
  //     {user && game && !game.is_finished && (
  //       <div style={{ minHeight: '100vh' }}>
  //         <div
  //           style={{
  //             display: 'flex',
  //             flexDirection: 'column',
  //             justifyContent: 'start',
  //             alignItems: 'center',
  //           }}
  //         >
  //           {getMaxNumberOfCards(room) !== 8 ? (
  //             <>
  //               <Text className={classes.description}>Trump card:</Text>
  //               <img
  //                 alt={room.atu}
  //                 src={`/svg/${room.atu}.svg`}
  //                 className={classes.image}
  //               />
  //               <Divider my='xl' className={classes.divider} />
  //             </>
  //           ) : (
  //             <div style={{ height: '10vh' }} />
  //           )}
  //           <Players
  //             room={room}
  //             user={user}
  //             callback={sendUpdate}
  //             userWithTurn={getCurrentPlayer()}
  //             voteOrder={playerOrder}
  //           />
  //           <Divider my='xl' className={classes.divider} />
  //           <Text size='md'>Community cards</Text>
  //           <div style={{ display: 'flex' }}>
  //             {room.cards?.split(',').map((card) => (
  //               <img
  //                 alt={card}
  //                 key={card}
  //                 src={`/svg/${card}.svg`}
  //                 className={classes.image}
  //               />
  //             ))}
  //             {Array.apply(
  //               null,
  //               Array(
  //                 room.Players.length - (room.cards?.split(',').length || 0)
  //               )
  //             ).map((_, index) => (
  //               <Skeleton
  //                 key={`skeleton ${index}`}
  //                 radius='md'
  //                 className={classes.skeleton}
  //               >
  //                 <img
  //                   alt=''
  //                   className={classes.image}
  //                   src={`/svg/AH.svg`}
  //                   style={{ margin: 0 }}
  //                 />
  //               </Skeleton>
  //             ))}
  //           </div>
  //           <Divider my='xl' className={classes.divider} />
  //         </div>
  //         <div
  //           style={{
  //             flexGrow: 1,
  //             width: '100vw',
  //             display: 'flex',
  //             flexDirection: 'column',
  //             alignItems: 'center',
  //           }}
  //         >
  //           <div>
  //             {(room.card_on_forehead === false ||
  //               getMaxNumberOfCards(room) !== 1 ||
  //               room.Players.filter((p) => p.initial_score === null).length ===
  //                 0) &&
  //               user.cards
  //                 .split(',')
  //                 .sort((a, b) => {
  //                   if (a[1] !== b[1]) return a.charCodeAt(1) - b.charCodeAt(1);
  //                   if (a[0] === 'A') return -1;
  //                   if (b[0] === 'A') return 1;
  //                   if (a[0] === 'K') return -1;
  //                   if (b[0] === 'K') return 1;
  //                   if (a[0] === 'Q') return -1;
  //                   if (b[0] === 'Q') return 1;
  //                   if (a[0] === 'J') return -1;
  //                   if (b[0] === 'J') return 1;
  //                   if (a[0] === 'T') return -1;
  //                   if (b[0] === 'T') return 1;
  //                   return a.charCodeAt(0) - b.charCodeAt(0);
  //                 })
  //                 .filter((c) => c.length > 0)
  //                 .map((card) =>
  //                   card !== lastCard ? (
  //                     <img
  //                       key={card}
  //                       alt={card}
  //                       src={`/svg/${card}.svg`}
  //                       className={classes.image}
  //                       onClick={() => playCard(card)}
  //                     />
  //                   ) : null
  //                 )}
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </>
  // );
}
