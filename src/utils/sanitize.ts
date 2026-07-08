/**
 * Lightweight input sanitization helpers to mitigate XSS and injection.
 * React already escapes text by default — use these when piping user input
 * into URLs, attributes, or non-React DOM contexts.
 */

import { z } from "zod";

/** Strip HTML tags and dangerous control chars. */
export const sanitizeText = (input: string, maxLen = 2000): string => {
  if (typeof input !== "string") return "";
  return input
    .replace(/<\/?[^>]+(>|$)/g, "") // strip HTML tags
    .replace(/[\u0000-\u001F\u007F]/g, "") // strip control chars
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .trim()
    .slice(0, maxLen);
};

/** Safely encode a value for use as a URL query parameter. */
export const safeUrlParam = (value: string): string =>
  encodeURIComponent(sanitizeText(value, 500));

/** Validate URL — only allow http(s). */
export const isSafeUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

/** Common reusable schemas. */
export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email")
  .max(255);

export const safeStringSchema = (max = 1000) =>
  z.string().trim().min(1).max(max).transform((v) => sanitizeText(v, max));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);
