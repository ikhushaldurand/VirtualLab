import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.routes.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

function parseOrigins(value) {
  if (!value || value === "*") return true;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: parseOrigins(process.env.CLIENT_URL),
      credentials: true,
    })
  );
  app.use(express.json());

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
