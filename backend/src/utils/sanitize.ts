import { AppError } from "./response.js";

/**
 * Sanitizes user input string by escaping HTML characters and trimming whitespace.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates a username:
 * - Must be non-empty string
 * - 2 to 32 characters long
 * - Letters, numbers, underscores, spaces, and hyphens only
 */
export function validateUsername(username: unknown): string {
  if (typeof username !== "string") {
    throw new AppError("Username must be a string", 400);
  }

  const trimmed = username.trim();
  if (trimmed.length < 2) {
    throw new AppError("Username must be at least 2 characters long", 400);
  }

  if (trimmed.length > 32) {
    throw new AppError("Username must not exceed 32 characters", 400);
  }

  const validPattern = /^[a-zA-Z0-9_\-\s]+$/;
  if (!validPattern.test(trimmed)) {
    throw new AppError(
      "Username may only contain letters, numbers, underscores, hyphens, and spaces",
      400
    );
  }

  return trimmed;
}

/**
 * Validates message text:
 * - Non-empty string after trimming
 * - Maximum 1000 characters
 * - Sanitized against XSS
 */
export function validateMessageText(text: unknown): string {
  if (typeof text !== "string") {
    throw new AppError("Message text must be a string", 400);
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new AppError("Message text cannot be empty", 400);
  }

  if (trimmed.length > 1000) {
    throw new AppError("Message text cannot exceed 1000 characters", 400);
  }

  return sanitizeText(trimmed);
}
