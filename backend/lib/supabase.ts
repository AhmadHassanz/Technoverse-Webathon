// The only file that creates Supabase clients. Server-only: never import it from frontend/.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

/**
 * Admin client: uses the SECRET key, so it bypasses RLS.
 * Used for every table query. Permission checks happen in services before it is used.
 */
export function adminClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Auth client: uses the PUBLISHABLE key and the request's cookies.
 * Only for signInWithPassword, signOut and getUser (the login session cookie).
 */
export async function authClient() {
  const cookieStore = await cookies();
  return createServerClient(env("SUPABASE_URL"), env("SUPABASE_PUBLISHABLE_KEY"), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Cookies can only be set inside route handlers; ignore otherwise.
        }
      },
    },
  });
}
