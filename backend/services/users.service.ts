// SERVICE layer for admin user management. Admin-only; every function receives the caller.
import { createAuthUser, findProfile, listProfiles, toUser, updateProfile } from "@/backend/data/users";
import { HttpError } from "@/backend/lib/errors";
import type { CreateUserInput, Me, Role, UpdateUserInput, User } from "@/shared/types";

export function listUsers(_admin: Me, filter: { role?: Role; q?: string }): Promise<User[]> {
  return listProfiles(filter);
}

/** Admin creates any role. The DB trigger makes the profile (as candidate), then we set the real role. */
export async function createUser(_admin: Me, input: CreateUserInput): Promise<User> {
  const { userId, error } = await createAuthUser(input);
  if (error || !userId) {
    if (error && (error.code === "email_exists" || /already|registered/i.test(error.message))) {
      throw new HttpError(409, "This email is already registered", { email: "Already registered" });
    }
    throw error ?? new Error("createUser returned no user");
  }
  if (input.role !== "candidate") await updateProfile(userId, { role: input.role });
  const row = await findProfile(userId);
  if (!row) throw new Error("Profile was not created");
  return toUser(row);
}

/** Change role or active flag. An admin can't demote or deactivate themselves (avoids locking everyone out). */
export async function updateUser(admin: Me, id: string, input: UpdateUserInput): Promise<User> {
  if (admin.id === id) {
    if (input.role !== undefined && input.role !== admin.role) {
      throw new HttpError(400, "You can't change your own role", { role: "You can't change your own role" });
    }
    if (input.isActive === false) {
      throw new HttpError(400, "You can't deactivate your own account", { isActive: "You can't deactivate yourself" });
    }
  }
  const updated = await updateProfile(id, input);
  if (!updated) throw new HttpError(404, "User not found");
  return updated;
}
