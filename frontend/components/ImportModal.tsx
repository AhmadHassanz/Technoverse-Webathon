"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, CircleCheck, FileText, Loader2 } from "lucide-react";
import { Button, Modal, Table, Td, Th, THead, Tr } from "@/frontend/components/ui";
import { apiPost, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { fmtDateTime } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";
import type { ImportInput, ImportResult } from "@/shared/types";

type Kind = "candidates" | "questions";

// Headers and sample rows from CONTRACT section 5 ("CSV formats").
const SAMPLES: Record<Kind, { header: string; rows: string[]; required: string }> = {
  candidates: {
    header: "full_name,email,password",
    rows: ["Ayesha Khan,ayesha.khan@example.edu,Demo@1234", "Hamza Ali,hamza.ali@example.edu,"],
    required: "Required columns: full_name, email. Optional: password (default Demo@1234).",
  },
  questions: {
    header:
      "topic,type,difficulty,marks,stem,option_a,option_b,option_c,option_d,option_e,option_f,correct,multi_scheme,negative_marks",
    rows: [
      'Databases,mcq_single,easy,2,"Which SQL keyword removes duplicate rows?",DISTINCT,UNIQUE,GROUP,ORDER,,,A,,0',
      'Databases,mcq_multi,medium,2,"Which of these are ACID properties?",Atomicity,Speed,Isolation,Durability,,,A;C;D,partial,0',
      'Databases,written,hard,5,"Explain the difference between 2NF and 3NF with an example.",,,,,,,,,',
    ],
    required: "Required columns: topic, type, difficulty, marks, stem, option_a…option_f, correct.",
  },
};

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const MAX_BYTES = 1024 * 1024;

export function ImportModal({
  kind,
  open,
  onClose,
  examId,
  onImported,
  doneLabel,
}: {
  kind: Kind;
  open: boolean;
  onClose: () => void;
  examId?: string;
  onImported?: (result: ImportResult) => void;
  doneLabel?: string;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [dry, setDry] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<{ result: ImportResult; at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const noun = kind === "questions" ? "questions" : "candidates";

  function reset() {
    setStep(1);
    setFileName("");
    setCsv("");
    setDry(null);
    setDone(null);
    setError(null);
    setBusy(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function send(text: string, dryRun: boolean) {
    const body: ImportInput = { csv: text, dryRun };
    if (examId && kind === "candidates") body.examId = examId;
    return apiPost<ImportResult>(`/api/import/${kind}`, body);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("Choose a .csv file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The file is larger than 1 MB.");
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const result = await send(text, true);
      setFileName(file.name);
      setCsv(text);
      setDry(result);
      setStep(2);
    } catch (err) {
      const e = toApiError(err);
      setError(e.fields ? Object.values(e.fields).join(" ") : errorMessage(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function confirmImport() {
    setBusy(true);
    setError(null);
    try {
      const result = await send(csv, false);
      setDone({ result, at: new Date().toISOString() });
      setStep(3);
      onImported?.(result);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const sample = SAMPLES[kind];
  const steps = ["Choose CSV", "Review dry run", "Import"];

  const stepper = (
    <ol className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-cobalt" aria-label="Import steps">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-3">
          <span className={cn("inline-flex items-center gap-1.5", step === i + 1 && "font-medium")} aria-current={step === i + 1 ? "step" : undefined}>
            {step > i + 1 ? <Check className="size-3.5" /> : <span>{i + 1}</span>}
            {label}
          </span>
          {i < steps.length - 1 && <ArrowRight className="size-3.5" aria-hidden />}
        </li>
      ))}
    </ol>
  );

  const errorRows = dry?.errors ?? [];

  return (
    <Modal
      open={open}
      onClose={close}
      eyebrow={`Bulk import / 0${step} of 03`}
      title={
        step === 1
          ? `Import ${noun}`
          : step === 2
            ? "Review your dry run"
            : `${done?.result.created ?? 0} ${noun} imported.`
      }
      description={
        step === 1
          ? "Upload, validate, then confirm. Nothing is saved until you approve the dry run."
          : step === 2
            ? `${fileName} · ${dry?.totalRows ?? 0} rows inspected · no changes saved`
            : `Your ${kind === "questions" ? "question bank" : "candidate list"} is up to date.${
                errorRows.length ? ` The ${errorRows.length} rows with errors were not imported.` : ""
              }`
      }
      width="md"
      footer={
        step === 1 ? (
          <>
            <Button
              variant="secondary"
              onClick={() => download(`sample_${kind}.csv`, [sample.header, ...sample.rows].join("\n") + "\n")}
            >
              Download sample CSV
            </Button>
            <Button onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Checking…" : "Choose CSV"}
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <Button variant="secondary" onClick={reset} disabled={busy}>
              Choose another CSV
            </Button>
            <Button onClick={confirmImport} disabled={busy || !dry || dry.validRows === 0}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Import {dry?.validRows ?? 0} rows
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={errorRows.length === 0}
              onClick={() =>
                download(
                  `${kind}_errors.csv`,
                  ["row,field,message", ...errorRows.map((e) => `${e.row},${e.field},"${e.message.replace(/"/g, '""')}"`)].join("\n") + "\n",
                )
              }
            >
              Download error CSV
            </Button>
            <Button onClick={close}>{doneLabel ?? "Done"}</Button>
          </>
        )
      }
    >
      {stepper}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="CSV file"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {step === 1 && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex w-full flex-col items-center rounded-[10px] border border-cobalt/30 bg-tint px-6 py-10 text-center transition-colors",
              dragging && "border-cobalt",
            )}
          >
            <FileText className="size-7 text-cobalt" strokeWidth={1.5} />
            <span className="mt-4 text-[1.0625rem] text-cobalt">
              {busy ? "Running dry run…" : "Drag a CSV here or choose a file"}
            </span>
            <span className="mt-3 text-xs text-mute">UTF-8 · CSV only · up to 1 MB · max 500 rows</span>
          </button>
          <p className="mt-4 text-xs text-mute">{sample.required}</p>
        </>
      )}

      {step === 2 && dry && (
        <>
          <div className="grid grid-cols-3 gap-4 rounded-[10px] border border-cobalt/30 bg-tint px-5 py-5">
            <div>
              <p className="meta-label">Total</p>
              <p className="num mt-2 text-[1.75rem] text-cobalt">{dry.totalRows}</p>
            </div>
            <div>
              <p className="meta-label">Ready</p>
              <p className="num mt-2 text-[1.75rem] text-cobalt">{dry.validRows}</p>
            </div>
            <div>
              <p className="meta-label">Errors</p>
              <p className="num mt-2 text-[1.75rem] text-danger">{dry.errors.length}</p>
            </div>
          </div>
          {dry.skipped > 0 && (
            <p className="mt-3 text-xs text-mute">{dry.skipped} rows already exist and will be skipped.</p>
          )}
          {errorRows.length > 0 ? (
            <>
              <h3 className="mt-6 text-[1.125rem] text-ink">{errorRows.length} rows need attention</h3>
              <p className="mt-1 text-[0.8125rem] text-mute">
                Correct the CSV and re-upload, or import only the {dry.validRows} valid rows.
              </p>
              <div className="mt-4 max-h-64 overflow-y-auto scrollbar-thin">
                <Table className="[&_table]:min-w-0">
                  <THead>
                    <tr>
                      <Th>Row</Th>
                      <Th>Field</Th>
                      <Th>Message</Th>
                    </tr>
                  </THead>
                  <tbody>
                    {errorRows.map((e, i) => (
                      <Tr key={`${e.row}-${e.field}-${i}`}>
                        <Td className="num">{e.row}</Td>
                        <Td>{e.field}</Td>
                        <Td className="text-danger">{e.message}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <p className="mt-4 text-[0.8125rem] text-ink">
                <Check className="mr-1 inline size-3.5" />
                Import valid rows only. Error rows will be skipped.
              </p>
            </>
          ) : (
            <p className="mt-6 flex items-center gap-2 text-sm text-success">
              <CircleCheck className="size-4" /> Every row is valid.
            </p>
          )}
        </>
      )}

      {step === 3 && done && (
        <>
          <p className="flex items-center gap-3 text-[1rem] text-success">
            <CircleCheck className="size-7" strokeWidth={1.5} />
            {done.result.created} added · {done.result.skipped} already existed · {done.result.errors.length} skipped
          </p>
          <div className="mt-6 rounded-md border border-cobalt/30 bg-tint px-4 py-3.5">
            <p className="num text-sm text-cobalt">{fileName}</p>
            <p className="mt-1 text-xs text-mute">Completed {fmtDateTime(done.at)}</p>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
