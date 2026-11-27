// Demo accounts (seed v1). Safe to run many times: it re-uses existing accounts and resets
// their password + role. Run:  npm run seed
// Self-contained on purpose (only @supabase/supabase-js) so Node can run it directly.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Run with: npm run seed");
  process.exit(1);
}
const supabase = createClient(url, secret, { auth: { persistSession: false } });

const PASSWORD = "Demo@1234";
const accounts = [
  { email: "admin@demo.com", fullName: "Hassan Admin", role: "admin" },
  { email: "examiner@demo.com", fullName: "Dr. Ayesha Khan", role: "examiner" },
  { email: "ali@demo.com", fullName: "Ali Raza", role: "candidate" },
  { email: "sara@demo.com", fullName: "Sara Ahmed", role: "candidate" },
  { email: "hamza@demo.com", fullName: "Hamza Malik", role: "candidate" },
];

async function findUserId(email: string): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
  }
  return null;
}

for (const a of accounts) {
  let id: string | null;
  const created = await supabase.auth.admin.createUser({
    email: a.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: a.fullName },
  });
  if (created.error) {
    id = await findUserId(a.email);
    if (!id) throw created.error;
    await supabase.auth.admin.updateUserById(id, { password: PASSWORD, email_confirm: true });
  } else {
    id = created.data.user.id;
  }
  const { error } = await supabase
    .from("profiles")
    .update({ role: a.role, full_name: a.fullName, is_active: true })
    .eq("id", id);
  if (error) throw error;
  console.log(`ok  ${a.role.padEnd(9)} ${a.email}`);
}
console.log(`Done. Password for all: ${PASSWORD}`);
