"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Trash2 } from "lucide-react";
import { Button, ConfirmModal } from "@/frontend/components/ui";
import { ExamForm } from "@/frontend/components/exam/ExamForm";
import { apiDelete, apiPatch, errorMessage } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/lib/toast";
import type { Exam, ExamDetail } from "@/shared/types";

export function DetailsTab({ exam, onChanged }: { exam: ExamDetail; onChanged: (e: Partial<ExamDetail>) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isDraft = exam.state === "draft";

  async function remove() {
    setBusy(true);
    try {
      await apiDelete(`/api/exams/${exam.id}`);
      toast("Draft deleted.");
      router.replace("/examiner");
    } catch (err) {
      toast(errorMessage(err), "danger");
      setBusy(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="max-w-4xl">
      {!isDraft && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-line bg-sand px-4 py-3.5 text-[0.875rem] text-ink">
          <Lock className="mt-0.5 size-4 shrink-0 text-mute" aria-hidden />
          <p>
            This exam is <strong>{exam.state}</strong>, so its details are locked. Only drafts can be edited
            {exam.state === "published" ? " — unpublish it first (possible until it starts and while nobody has an attempt)." : "."}
          </p>
        </div>
      )}
      <ExamForm
        key={`${exam.id}-${exam.state}`}
        exam={exam}
        readOnly={!isDraft}
        submitLabel="Save details"
        onSubmit={async (input) => {
          const updated = await apiPatch<Exam>(`/api/exams/${exam.id}`, input);
          onChanged(updated);
          toast("Details saved.");
        }}
      />
      {isDraft && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-danger/30 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-danger">Delete this draft</p>
            <p className="mt-1 text-xs text-mute">Removes the exam, its pool and enrollments. Questions stay in your bank.</p>
          </div>
          <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete draft
          </Button>
        </div>
      )}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        eyebrow="Delete draft"
        title={`Delete “${exam.title}”?`}
        description="The draft, its question pool and its enrollments are removed. Your question bank is not touched."
        warning="This cannot be undone"
        confirmLabel="Delete draft"
        onConfirm={() => void remove()}
        busy={busy}
      />
    </div>
  );
}
