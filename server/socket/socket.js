import { Server } from "socket.io";
import { attachRoomHandlers } from "./room.handler.js";

function parseOrigins(value) {
  if (!value || value === "*") return "*";
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: parseOrigins(process.env.CLIENT_URL),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.emit("welcome", {
      message: "Welcome to Virtual Lab",
      socketId: socket.id,
    });
    attachRoomHandlers(io, socket);
  });

  return io;
}
