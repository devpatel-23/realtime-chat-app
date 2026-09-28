import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response.js';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 'Endpoint not found', 404);
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Handle syntax error (e.g. malformed JSON body)
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    res.status(400).json({
      success: false,
      error: 'Malformed JSON payload'
    });
    return;
  }

  console.error('Unhandled error in request pipeline:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
