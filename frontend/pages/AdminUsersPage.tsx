"use client";

import { useMemo, useState } from "react";
import { ImportModal } from "@/frontend/components/ImportModal";
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
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/frontend/components/ui";
import { useAuth } from "@/frontend/lib/auth";
import { useToast } from "@/frontend/lib/toast";
import { fmtDate } from "@/frontend/lib/format";
import { apiPatch, apiPost, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { useApi } from "@/frontend/lib/useApi";
import { zodFields } from "@/frontend/lib/forms";
import { createUserSchema } from "@/shared/validation";
import type { Role, UpdateUserInput, User } from "@/shared/types";

const roleOptions: { value: Role; label: string }[] = [
  { value: "candidate", label: "Candidate" },
  { value: "examiner", label: "Examiner" },
  { value: "admin", label: "Administrator" },
];

const roleTitle = (role: Role) =>
  role === "admin" ? "Administrator" : role === "examiner" ? "Examiner" : "Candidate";

const PAGE_SIZE = 8;
const EMPTY_FORM = { fullName: "", email: "", password: "", role: "candidate" as Role };

export default function AdminUsersPage() {
  const { me } = useAuth();
  const { toast } = useToast();
  const { data, error, loading, reload, setData } = useApi<User[]>("/api/admin/users");
  const users = useMemo(() => data ?? [], [data]);
  const setUsers = (fn: (all: User[]) => User[]) => setData((all) => fn(all ?? []));
  const [importOpen, setImportOpen] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [page, setPage] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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

  async function patchUser(user: User, patch: UpdateUserInput): Promise<User | null> {
    try {
      const updated = await apiPatch<User>(`/api/admin/users/${user.id}`, patch);
      setUsers((all) => all.map((u) => (u.id === updated.id ? updated : u)));
      return updated;
    } catch (err) {
      const e = toApiError(err);
      toast(e.fields ? Object.values(e.fields)[0] : errorMessage(e), "danger");
      return null;
    }
  }

  async function updateRole(user: User, role: Role) {
    if (user.id === me?.id) {
      toast("You cannot change your own role.", "danger");
      return;
    }
    const updated = await patchUser(user, { role });
    if (updated) toast(`${updated.fullName} is now ${roleTitle(role).toLowerCase()}.`);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createUserSchema.safeParse(form);
    if (!parsed.success) {
      setFields(zodFields(parsed.error));
      return;
    }
    setFields({});
    setCreateBusy(true);
    try {
      const created = await apiPost<User>("/api/admin/users", parsed.data);
      setUsers((all) => [created, ...all]);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      toast(`${created.fullName} was added to the register.`);
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.fields) setFields(apiErr.fields);
      else toast(errorMessage(apiErr), "danger");
    } finally {
      setCreateBusy(false);
    }
  }

  async function confirmToggle() {
    if (!pendingToggle) return;
    setToggleBusy(true);
    const updated = await patchUser(pendingToggle, { isActive: !pendingToggle.isActive });
    setToggleBusy(false);
    setPendingToggle(null);
    if (updated) {
      toast(updated.isActive ? `${updated.fullName} can sign in again.` : `${updated.fullName} was deactivated.`);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="People & access"
        title="The right access, for everyone."
        description="Manage institutional accounts, roles and access. Deactivated accounts keep their history."
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
          onClick={() => setImportOpen(true)}
        >
          <FileUp className="size-4" />
          Import CSV
        </Button>
      </div>

      <div className="mt-6">
        {loading && !data ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading users">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : error && !data ? (
          <ErrorState onRetry={reload} description={errorMessage(error)} />
        ) : users.length === 0 ? (
          <EmptyState title="No accounts yet" description="Create the first user or import a CSV." />
        ) : (
        <>
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
                        onChange={(e) => void updateRole(user, e.target.value as Role)}
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
                <Td className="py-12 text-center text-mute" colSpan={6}>
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
        </>
        )}
      </div>

      <ImportModal
        kind="candidates"
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => reload()}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        eyebrow="Administration / new account"
        title="Create user"
        description="The person can sign in straight away with this email and password."
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
          <Field
            label="Temporary password"
            htmlFor="cu-password"
            hint="At least 8 characters, with a letter and a number. Share it securely."
            error={fields.password}
          >
            <Input
              id="cu-password"
              type="text"
              autoComplete="new-password"
              placeholder="e.g. Welcome@2026"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              invalid={Boolean(fields.password)}
              required
            />
          </Field>
          <Field label="Role" htmlFor="cu-role" error={fields.role}>
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
              Passwords are kept by the auth service, never in our own tables. The role can be changed later.
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
        warningDetail="Their account and history stay; they just cannot sign in until reactivated."
        confirmLabel="Deactivate user"
        onConfirm={() => void confirmToggle()}
        busy={toggleBusy}
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
            <Button onClick={() => void confirmToggle()} disabled={toggleBusy}>
              {toggleBusy && <Loader2 className="size-4 animate-spin" />}
              Activate user
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-cobalt/20 bg-tint px-4 py-3.5">
          <p className="text-[0.8125rem] font-medium text-cobalt">
            Existing role: {pendingToggle ? roleTitle(pendingToggle.role) : "—"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink/75">
            They keep the same role and can sign in again immediately.
          </p>
        </div>
      </Modal>
    </>
  );
}
