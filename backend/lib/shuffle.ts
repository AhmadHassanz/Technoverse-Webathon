// Fair shuffling with crypto.randomInt (not Math.random, which is predictable).
import { randomInt } from "node:crypto";

/** Returns a new, randomly ordered copy (Fisher-Yates). */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Returns `count` random items (no repeats). Asks for more than exist -> returns all of them. */
export function sample<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, count));
}
