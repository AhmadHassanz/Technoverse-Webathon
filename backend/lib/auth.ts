// Who is calling? Every service starts with one of these.
//   getCurrentUser()  -> user or null
//   requireUser()     -> user, or throws 401 (no session or deactivated account)
//   requireRole(...)  -> user with one of the roles, or throws 403
import { authClient } from "@/backend/lib/supabase";
import { findProfile, toMe } from "@/backend/data/users";
import { HttpError } from "@/backend/lib/errors";
import type { Me, Role } from "@/shared/types";

/** The logged-in user from the session cookie, or null (no session / unknown / deactivated). */
export async function getCurrentUser(): Promise<Me | null> {
  const supabase = await authClient();
  // Checks the token's signature on OUR server (no network call to Supabase Auth), so it is fast.
  // The profile lookup below still re-checks that the account exists and is active on every request.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const row = await findProfile(userId);
  if (!row || !row.is_active) return null;
  return toMe(row);
}

export async function requireUser(): Promise<Me> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<Me> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new HttpError(403, "You don't have access to this");
  return user;
}

/** Admins may manage anything; everyone else only what they created. Throws 403 otherwise. */
export function assertOwner(user: Me, createdBy: string) {
  if (user.role !== "admin" && user.id !== createdBy) throw new HttpError(403, "You don't have access to this");
}
