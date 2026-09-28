import { Request, Response } from 'express';
import { presenceService } from '../services/presence.service.js';
import { sendSuccess } from '../utils/response.js';

export class UserController {
  public static getOnlineUsers(_req: Request, res: Response): void {
    const users = presenceService.getOnlineUsers();
    sendSuccess(res, {
      users,
      count: users.length
    });
  }
}
