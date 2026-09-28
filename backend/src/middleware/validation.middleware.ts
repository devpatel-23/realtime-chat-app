import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response.js';

export function validateLoginBody(req: Request, _res: Response, next: NextFunction): void {
  const { username } = req.body || {};
  if (!username || typeof username !== 'string' || !username.trim()) {
    return next(new AppError('Username is required', 400));
  }
  next();
}

export function validateMessageBody(req: Request, _res: Response, next: NextFunction): void {
  const { username, text } = req.body || {};
  if (!username || typeof username !== 'string' || !username.trim()) {
    return next(new AppError('Username is required', 400));
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    return next(new AppError('Message text is required', 400));
  }
  next();
}
