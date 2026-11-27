"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Loader2,
  Search,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/shell/PageHeader";
import {
  Button,
  Card,
  ConfirmModal,
  Field,
  Input,
  Modal,
  Select,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/frontend/components/ui";
import { useAuth } from "@/frontend/lib/auth";
import { useToast } from "@/frontend/lib/toast";
import { fmtDate } from "@/frontend/lib/format";
import { MOCK_USERS } from "@/frontend/lib/mock";
import type { Role, User } from "@/shared/types";

const roleOptions: { value: Role; label: string }[] = [
  { value: "candidate", label: "Candidate" },
  { value: "examiner", label: "Examiner" },
  { value: "admin", label: "Administrator" },
];

const roleTitle = (role: Role) =>
  role === "admin" ? "Administrator" : role === "examiner" ? "Examiner" : "Candidate";

const PAGE_SIZE = 6;

export default function AdminUsersPage() {
  const { me } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [page, setPage] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", role: "candidate" as Role });
  const [fields, setFields] = useState<Record<string, string>>({});

  const [pendingToggle, setPendingToggle] = useState<User | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !q ||
        user.fullName.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const active = users.filter((u) => u.isActive).length;
  const inactive = users.length - active;
  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    examiner: users.filter((u) => u.role === "examiner").length,
    candidate: users.filter((u) => u.role === "candidate").length,
  };

  function updateRole(id: string, role: Role) {
    if (id === me?.id) {
      toast("You cannot change your own role.", "danger");
      return;
    }
    setUsers((all) => all.map((u) => (u.id === id ? { ...u, role } : u)));
    toast(`Role updated to ${roleTitle(role)}.`);
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 2) next.fullName = "Enter the full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
      next.email = "Already registered";
    }
    setFields(next);
    if (Object.keys(next).length > 0) return;

    setCreateBusy(true);
    window.setTimeout(() => {
      const created: User = {
        id: `u-${Date.now()}`,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setUsers((all) => [created, ...all]);
      setCreateBusy(false);
      setCreateOpen(false);
      setForm({ fullName: "", email: "", role: "candidate" });
      setFields({});
      toast(`${created.fullName} was added to the register.`);
    }, 500);
  }

  function confirmToggle() {
    if (!pendingToggle) return;
    const next = { ...pendingToggle, isActive: !pendingToggle.isActive };
    setUsers((all) => all.map((u) => (u.id === next.id ? next : u)));
    setPendingToggle(null);
    toast(next.isActive ? `${next.fullName} can sign in again.` : `${next.fullName} was deactivated.`);
  }

  return (
    <>
      <PageHeader
        eyebrow="People & access"
        title="The right access, for everyone."
        description="Manage institutional accounts, roles and access. Changes are recorded in the audit trail."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" />
            Create user
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 px-7 py-5">
        <p className="text-[1.125rem] text-cobalt">
          <span className="num">{users.length}</span> accounts
        </p>
        <p className="text-[1.125rem] text-success">
          <span className="num">{active}</span> active
        </p>
        <p className="text-[1.125rem] text-mute">
          <span className="num">{inactive}</span> inactive
        </p>
        <p className="text-[0.8125rem] text-mute sm:ml-auto">
          {counts.admin} administrators · {counts.examiner} examiners · {counts.candidate} candidates
        </p>
      </Card>

      <div className="mt-7 grid gap-4 md:grid-cols-[1.6fr_1fr_1fr] md:items-end">
        <Field label="Search users" htmlFor="user-search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <Input
              id="user-search"
              placeholder="Search name or email"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              className="pl-10"
            />
          </div>
        </Field>

        <Field label="Role" htmlFor="role-filter">
          <Select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as Role | "all");
              setPage(0);
            }}
          >
            <option value="all">All roles</option>
            <option value="admin">Administrator</option>
            <option value="examiner">Examiner</option>
            <option value="candidate">Candidate</option>
          </Select>
        </Field>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() =>
            toast("Choose a CSV file to import accounts (bulk import is coming with the API).", "info")
          }
        >
          <FileUp className="size-4" />
          Import CSV
        </Button>
      </div>

      <div className="mt-6">
        <Table className="rounded-[10px]">
          <THead>
            <tr>
              <Th className="w-[22%]">Name</Th>
              <Th className="w-[24%]">Email</Th>
              <Th className="w-[15%]">Role</Th>
              <Th className="w-[13%]">Status</Th>
              <Th className="w-[14%]">Created</Th>
              <Th className="w-[12%]">Access action</Th>
            </tr>
          </THead>
          <tbody>
            {rows.map((user) => {
              const isSelf = user.id === me?.id;
              return (
                <Tr key={user.id}>
                  <Td className="font-medium text-ink">{user.fullName}</Td>
                  <Td className="text-mute">{user.email}</Td>
                  <Td>
                    <div className="relative inline-flex items-center">
                      <select
                        aria-label={`Role for ${user.fullName}`}
                        value={user.role}
                        disabled={isSelf}
                        onChange={(e) => updateRole(user.id, e.target.value as Role)}
                        className="cursor-pointer appearance-none bg-transparent py-1 pr-5 text-[0.875rem] text-ink disabled:cursor-default"
                      >
                        <option value="candidate">Candidate</option>
                        <option value="examiner">Examiner</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-0 size-3 text-mute" />
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2 text-[0.8125rem] text-ink">
                      <span
                        className={
                          user.isActive
                            ? "size-2 rounded-full border border-ink bg-ink"
                            : "size-2 rounded-full border border-mute bg-transparent"
                        }
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </Td>
                  <Td className="num text-[0.8125rem] text-mute">{fmtDate(user.createdAt)}</Td>
                  <Td>
                    {isSelf ? (
                      <button
                        type="button"
                        onClick={() => toast("Your account is protected. Another administrator can change it.", "info")}
                        className="text-[0.8125rem] text-cobalt hover:underline"
                      >
                        View protected account
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingToggle(user)}
                        className="text-[0.8125rem] text-cobalt hover:underline"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </Td>
                </Tr>
              );
            })}
            {rows.length === 0 && (
              <Tr>
                <Td className="py-12 text-center text-mute" >
                  <span className="block">No accounts match this search.</span>
                </Td>
              </Tr>
            )}
          </tbody>
        </Table>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[0.8125rem] text-mute">
            Showing {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
            {Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length} users
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        eyebrow="Administration / new account"
        title="Create user"
        description="The account is activated after the first secure sign-in."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={createBusy}>
              Cancel
            </Button>
            <Button type="submit" form="create-user-form" disabled={createBusy}>
              {createBusy && <Loader2 className="size-4 animate-spin" />}
              Create user
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={submitCreate} className="space-y-5" noValidate>
          <Field label="Full name" htmlFor="cu-name" error={fields.fullName}>
            <Input
              id="cu-name"
              placeholder="Mariam Siddiqui"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              invalid={Boolean(fields.fullName)}
              required
            />
          </Field>
          <Field label="Institutional email" htmlFor="cu-email" error={fields.email}>
            <Input
              id="cu-email"
              type="email"
              placeholder="mariam.siddiqui@example.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              invalid={Boolean(fields.email)}
              required
            />
          </Field>
          <Field label="Role" htmlFor="cu-role">
            <Select
              id="cu-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-md border border-cobalt/20 bg-tint px-4 py-3.5">
            <p className="text-[0.8125rem] font-medium text-cobalt">Secure activation</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink/80">
              A one-time sign-in link will be sent to this address.
            </p>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(pendingToggle && pendingToggle.isActive)}
        onClose={() => setPendingToggle(null)}
        eyebrow="Access change"
        title={`Deactivate ${pendingToggle?.fullName ?? "this user"}?`}
        description={`${pendingToggle?.fullName.split(" ")[0] ?? "This user"} will no longer be able to sign in. Existing answers and results are preserved.`}
        warning="Active attempts are not deleted"
        warningDetail="This change is recorded in the access audit trail."
        confirmLabel="Deactivate user"
        onConfirm={confirmToggle}
      />

      <Modal
        open={Boolean(pendingToggle && !pendingToggle.isActive)}
        onClose={() => setPendingToggle(null)}
        eyebrow="Access change"
        title={`Activate ${pendingToggle?.fullName ?? "this user"}?`}
        description={`${pendingToggle?.fullName.split(" ")[0] ?? "This user"} will be able to sign in and access assigned exams again.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingToggle(null)}>
              Cancel
            </Button>
            <Button onClick={confirmToggle}>Activate user</Button>
          </>
        }
      >
        <div className="rounded-md border border-cobalt/20 bg-tint px-4 py-3.5">
          <p className="text-[0.8125rem] font-medium text-cobalt">
            Existing role: {pendingToggle ? roleTitle(pendingToggle.role) : "—"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink/75">
            This change is recorded in the access audit trail.
          </p>
        </div>
      </Modal>
    </>
  );
}
