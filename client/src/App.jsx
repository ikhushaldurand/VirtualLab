import { useEffect } from "react";
import { AppRoutes } from "./routes/AppRoutes.jsx";
import { connectSocket, getSocket } from "./socket/socketClient.js";

export default function App() {
  useEffect(() => {
    const socket = connectSocket();

    const onWelcome = (payload) => {
      console.info("[Virtual Lab socket]", payload);
    };

    socket.on("welcome", onWelcome);

    return () => {
      socket.off("welcome", onWelcome);
    };
  }, []);

  return <AppRoutes />;
}
