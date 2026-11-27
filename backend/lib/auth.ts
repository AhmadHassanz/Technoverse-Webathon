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
  const { data } = await supabase.auth.getUser(); // verifies the token with Supabase
  if (!data.user) return null;
  const row = await findProfile(data.user.id);
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
