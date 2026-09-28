import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/index.js";

let dbInstance: Database.Database | null = null;

export function getDatabase(customPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || config.dbPath;

  if (dbPath !== ":memory:") {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  // Enable WAL mode for performance and concurrency if not in-memory
  if (dbPath !== ":memory:") {
    db.pragma("journal_mode = WAL");
  }
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");

  initSchema(db);

  dbInstance = db;
  return dbInstance;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('sent', 'delivered', 'read'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt ASC);
  `);
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
