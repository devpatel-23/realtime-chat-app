import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
  };
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, errorMessage: string, statusCode = 400): Response {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: errorMessage,
  };
  return res.status(statusCode).json(body);
}
