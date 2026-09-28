import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

export interface AppConfig {
  port: number;
  clientOrigin: string;
  dbPath: string;
  nodeEnv: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || "4000", 10),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), "data/chat.db"),
  nodeEnv: process.env.NODE_ENV || "development",
};
