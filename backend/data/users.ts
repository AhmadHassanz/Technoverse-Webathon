// DATA layer for users/profiles: the only place that queries the profiles table.
// Converts the database's snake_case rows to the camelCase shapes in shared/types.ts.
import { adminClient } from "@/backend/lib/supabase";
import type { Me, Preferences, Role, User } from "@/shared/types";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  preferences: Preferences;
  created_at: string;
};

export function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function toMe(row: ProfileRow): Me {
  return { ...toUser(row), preferences: row.preferences };
}

export async function findProfile(id: string): Promise<ProfileRow | null> {
  const { data, error } = await adminClient().from("profiles").select("*").eq("id", id).maybeSingle<ProfileRow>();
  if (error) throw error;
  return data;
}

/** Turn user-typed search text into something safe inside a PostgREST `or(...)` filter. */
function cleanSearch(q: string) {
  return q.replace(/[,()%_*\\]/g, " ").trim();
}

export async function listProfiles(filter: { role?: Role; q?: string; limit?: number }): Promise<User[]> {
  let query = adminClient().from("profiles").select("*").order("created_at", { ascending: false });
  if (filter.role) query = query.eq("role", filter.role);
  const q = filter.q ? cleanSearch(filter.q) : "";
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  if (filter.limit) query = query.limit(filter.limit);
  const { data, error } = await query.returns<ProfileRow[]>();
  if (error) throw error;
  return data.map(toUser);
}

export async function updateProfile(id: string, changes: { role?: Role; isActive?: boolean }): Promise<User | null> {
  const patch: Record<string, unknown> = {};
  if (changes.role !== undefined) patch.role = changes.role;
  if (changes.isActive !== undefined) patch.is_active = changes.isActive;
  const { data, error } = await adminClient().from("profiles").update(patch).eq("id", id).select("*").maybeSingle<ProfileRow>();
  if (error) throw error;
  return data ? toUser(data) : null;
}

/** Create the Supabase login (email already confirmed). A DB trigger creates the profile row. */
export async function createAuthUser(input: { email: string; password: string; fullName: string }) {
  const { data, error } = await adminClient().auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  return { userId: data.user?.id ?? null, error };
}
