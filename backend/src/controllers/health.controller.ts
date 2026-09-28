import { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";

export class HealthController {
  public static check(_req: Request, res: Response): void {
    sendSuccess(res, {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
}
