// SERVICE layer for login/signup. Business rules live here; no HTTP, no raw queries.
import { createAuthUser, findProfile, toMe } from "@/backend/data/users";
import { authClient } from "@/backend/lib/supabase";
import { HttpError } from "@/backend/lib/errors";
import type { LoginInput, Me, SignupInput } from "@/shared/types";

/** Public signup always makes a candidate (the DB trigger sets the role). Then logs the user in. */
export async function signup(input: SignupInput): Promise<Me> {
  const { error } = await createAuthUser(input);
  if (error) {
    if (error.code === "email_exists" || /already|registered/i.test(error.message)) {
      throw new HttpError(409, "This email is already registered", { email: "Already registered" });
    }
    throw error;
  }
  return login({ email: input.email, password: input.password });
}

/** Check the password with Supabase (this also sets the httpOnly session cookie). */
export async function login(input: LoginInput): Promise<Me> {
  const supabase = await authClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error || !data.user) throw new HttpError(401, "Wrong email or password");

  const profile = await findProfile(data.user.id);
  if (!profile) throw new HttpError(401, "Wrong email or password");
  if (!profile.is_active) {
    await supabase.auth.signOut(); // do not keep a session for a deactivated account
    throw new HttpError(403, "This account has been deactivated");
  }
  return toMe(profile);
}

export async function logout(): Promise<void> {
  const supabase = await authClient();
  await supabase.auth.signOut();
}
