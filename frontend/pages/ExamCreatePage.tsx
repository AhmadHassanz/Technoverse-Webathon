"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/frontend/components/shell/PageHeader";
import { BackLink } from "@/frontend/components/ui";
import { ExamForm } from "@/frontend/components/exam/ExamForm";
import { apiPost } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/lib/toast";
import type { Exam } from "@/shared/types";

export default function ExamCreatePage() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <>
      <BackLink href="/examiner">Back to overview</BackLink>
      <PageHeader
        className="mt-5"
        eyebrow="Examiner / new examination"
        title="Set up a new examination."
        description="Start with the basics. You can add questions, a blueprint and candidates next; nothing is visible to candidates until you publish."
      />
      <div className="max-w-4xl">
        <ExamForm
          submitLabel="Create draft exam"
          onCancel={() => router.push("/examiner")}
          onSubmit={async (input) => {
            const exam = await apiPost<Exam>("/api/exams", input);
            toast("Draft created. Now add questions.");
            router.push(`/examiner/exams/${exam.id}?tab=questions`);
          }}
        />
      </div>
    </>
  );
}
