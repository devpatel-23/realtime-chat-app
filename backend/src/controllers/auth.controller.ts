import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { validateUsername } from '../utils/sanitize.js';

export class AuthController {
  public static login(req: Request, res: Response, next: NextFunction): void {
    try {
      const { username } = req.body;
      const validUsername = validateUsername(username);

      sendSuccess(res, {
        username: validUsername,
        message: 'Login successful'
      });
    } catch (err) {
      next(err);
    }
  }
}
