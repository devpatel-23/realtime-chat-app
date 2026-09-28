import crypto from "crypto";
import {
  IMessageRepository,
  Message,
  MessageStatus,
  SQLiteMessageRepository,
  FindMessagesOptions,
} from "../repositories/message.repository.js";
import { validateMessageText, validateUsername } from "../utils/sanitize.js";
import { AppError } from "../utils/response.js";

export class MessageService {
  private repository: IMessageRepository;

  constructor(repository?: IMessageRepository) {
    this.repository = repository || new SQLiteMessageRepository();
  }

  public createMessage(username: unknown, text: unknown, customId?: string): Message {
    let validUsername: string;
    let validText: string;

    try {
      validUsername = validateUsername(username);
    } catch (err: any) {
      throw new AppError(err.message || "Invalid username", 400);
    }

    try {
      validText = validateMessageText(text);
    } catch (err: any) {
      throw new AppError(err.message || "Invalid message text", 400);
    }

    const message: Message = {
      id: customId || crypto.randomUUID(),
      username: validUsername,
      text: validText,
      createdAt: new Date().toISOString(),
      status: "sent",
    };

    return this.repository.create(message);
  }

  public getHistory(options: FindMessagesOptions): Message[] {
    return this.repository.find(options);
  }

  public getMessageById(id: string): Message | null {
    return this.repository.findById(id);
  }

  public updateStatus(id: string, status: MessageStatus): Message | null {
    if (!["sent", "delivered", "read"].includes(status)) {
      throw new AppError("Invalid status value", 400);
    }
    return this.repository.updateStatus(id, status);
  }

  public markDelivered(ids: string[]): number {
    return this.repository.updateStatusBulk(ids, "delivered");
  }

  public markRead(ids: string[]): number {
    return this.repository.updateStatusBulk(ids, "read");
  }
}

export const messageService = new MessageService();
