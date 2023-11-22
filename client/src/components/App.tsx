import { useEffect } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Homepage from "./Homepage";
import Room from "./Room";
import Game from "./Game";
import { useUserContext } from "../store/user-context";
import fetchUser from "../lib/fetch-user";

const router = createBrowserRouter([
  { path: "/", element: <Homepage /> },
  { path: "/room/:id", element: <Room /> },
  { path: "/room/:id/game", element: <Game /> },
]);

export default function App() {
  const { setUser } = useUserContext();

  useEffect(() => {
    const setUserContext = async () => {
      const user = await fetchUser();
      setUser(user);
    };
    setUserContext();
  }, [setUser]);

  return (
    <MantineProvider defaultColorScheme="dark">
      <Notifications position="bottom-right" />
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
