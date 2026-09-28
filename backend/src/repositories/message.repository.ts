import type Database from 'better-sqlite3';
import { getDatabase } from '../db/index.js';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  username: string;
  text: string;
  createdAt: string;
  status: MessageStatus;
}

export interface FindMessagesOptions {
  limit?: number;
  before?: string; // ISO timestamp
}

export interface IMessageRepository {
  create(message: Message): Message;
  find(options: FindMessagesOptions): Message[];
  findById(id: string): Message | null;
  updateStatus(id: string, status: MessageStatus): Message | null;
  updateStatusBulk(ids: string[], status: MessageStatus): number;
}

export class SQLiteMessageRepository implements IMessageRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  create(message: Message): Message {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, username, text, createdAt, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(message.id, message.username, message.text, message.createdAt, message.status);
    return message;
  }

  find(options: FindMessagesOptions = {}): Message[] {
    const limit = Math.min(Math.max(options.limit || 50, 1), 100);

    let rows: any[];
    if (options.before) {
      const stmt = this.db.prepare(`
        SELECT id, username, text, createdAt, status
        FROM messages
        WHERE createdAt < ?
        ORDER BY createdAt DESC
        LIMIT ?
      `);
      rows = stmt.all(options.before, limit);
    } else {
      const stmt = this.db.prepare(`
        SELECT id, username, text, createdAt, status
        FROM messages
        ORDER BY createdAt DESC
        LIMIT ?
      `);
      rows = stmt.all(limit);
    }

    // Return oldest to newest
    const messages: Message[] = (rows as Message[]).reverse();
    return messages;
  }

  findById(id: string): Message | null {
    const stmt = this.db.prepare(`
      SELECT id, username, text, createdAt, status
      FROM messages
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as Message) || null;
  }

  updateStatus(id: string, status: MessageStatus): Message | null {
    const stmt = this.db.prepare(`
      UPDATE messages
      SET status = ?
      WHERE id = ?
    `);
    stmt.run(status, id);
    return this.findById(id);
  }

  updateStatusBulk(ids: string[], status: MessageStatus): number {
    if (ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      UPDATE messages
      SET status = ?
      WHERE id IN (${placeholders})
    `);
    const result = stmt.run(status, ...ids);
    return Number(result.changes || 0);
  }
}
