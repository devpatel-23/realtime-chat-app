import express, { Express } from "express";
import cors from "cors";
import { config } from "./config/index.js";
import apiRouter, { healthRoutes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

export function createApp(): Express {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests from client origin, local dev origins, or server-to-server (no origin)
        callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parser
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger in non-test mode
  if (config.nodeEnv !== "test") {
    app.use((req, _res, next) => {
      if (req.path !== "/health") {
        console.log(`[HTTP] ${req.method} ${req.path}`);
      }
      next();
    });
  }

  // Mount routes
  app.use("/health", healthRoutes);
  app.use("/api", apiRouter);

  // Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
