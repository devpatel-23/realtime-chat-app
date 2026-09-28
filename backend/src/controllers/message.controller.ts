import { Request, Response, NextFunction } from "express";
import { messageService } from "../services/message.service.js";
import { sendSuccess } from "../utils/response.js";
import { broadcastMessage } from "../sockets/index.js";

export class MessageController {
  public static create(req: Request, res: Response, next: NextFunction): void {
    try {
      const { username, text } = req.body;
      const message = messageService.createMessage(username, text);

      // Broadcast via Socket.io
      broadcastMessage(message);

      sendSuccess(res, message, 201);
    } catch (err) {
      next(err);
    }
  }

  public static list(req: Request, res: Response, next: NextFunction): void {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const before = req.query.before ? (req.query.before as string) : undefined;

      const messages = messageService.getHistory({ limit, before });
      sendSuccess(res, messages);
    } catch (err) {
      next(err);
    }
  }
}
