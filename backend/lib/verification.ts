// Verification codes printed on result reports (and inside the QR code).
// 10 characters from an alphabet WITHOUT look-alikes (no 0/O, no 1/I), made with crypto randomness.
import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 10;
const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** Cleans what a person typed (spaces, lower case). Returns null when it can never be a valid code. */
export function normalizeCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** "Ali Raza" -> "A. R."  (the public verify page shows initials only, never the full name). */
export function initials(fullName: string): string {
  const letters = fullName
    .split(/\s+/)
    .map((word) => [...word].find((ch) => /\p{L}/u.test(ch)))
    .filter((ch): ch is string => ch !== undefined)
    .slice(0, 3)
    .map((ch) => `${ch.toUpperCase()}.`);
  return letters.length ? letters.join(" ") : "?";
}
