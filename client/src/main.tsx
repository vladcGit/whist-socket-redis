import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import UserContextProvider from "./store/user-context";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserContextProvider>
      <App />
    </UserContextProvider>
  </React.StrictMode>
);
