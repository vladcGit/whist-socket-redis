import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Homepage from "./Homepage";
import Room from "./Room";
import Game from "./Game";

const router = createBrowserRouter([
  { path: "/", element: <Homepage /> },
  { path: "/room/:id", element: <Room /> },
  { path: "/room/:id/game", element: <Game /> },
]);

export default function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <Notifications position="bottom-right" />
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
