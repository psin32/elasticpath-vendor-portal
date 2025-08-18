import { v4 as uuidv4 } from "uuid";

/**
 * Generate a UUID v4 string using the uuid library
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generate a short UUID (8 characters) for display purposes
 * @returns A short UUID string
 */
export function generateShortUUID(): string {
  const fullUUID = generateUUID();
  return fullUUID.split("-")[0];
}
