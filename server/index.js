import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { initSocket } from "./socket/socket.js";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  await connectDatabase();

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for authentication");
  }

  const app = createApp();
  const httpServer = http.createServer(app);

  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Virtual Lab API listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
