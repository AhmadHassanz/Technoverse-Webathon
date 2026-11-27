"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Trash2 } from "lucide-react";
import { Drawer, Tabs } from "@/frontend/components/ui";
import { apiPut } from "@/frontend/lib/api-client";
import { fmtTime } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";

const W = 640;
const H = 420;

/** Private rough work: text + a simple drawing canvas. Autosaved every 5 s. Never graded. */
export function Scratchpad({
  attemptId,
  initial,
  open,
  onClose,
}: {
  attemptId: string;
  initial: { text: string; drawing: string | null };
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"text" | "draw">("text");
  const [text, setText] = useState(initial.text);
  const [drawing, setDrawing] = useState<string | null>(initial.drawing);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);
  const latest = useRef({ text, drawing });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingNow = useRef(false);

  useEffect(() => {
    latest.current = { text, drawing };
  }, [text, drawing]);

  const save = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    try {
      const r = await apiPut<{ savedAt: string }>(`/api/attempts/${attemptId}/scratchpad`, latest.current);
      setSavedAt(r.savedAt);
      setError(null);
    } catch (err) {
      dirty.current = true; // try again on the next tick
      setError(err instanceof Error && err.message !== "No connection" ? err.message : "Not saved yet — offline");
    }
  }, [attemptId]);

  useEffect(() => {
    const id = window.setInterval(() => void save(), 5000);
    return () => window.clearInterval(id);
  }, [save]);

  // Paint the saved drawing whenever the canvas appears.
  const attachCanvas = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    const src = latest.current.drawing;
    if (src) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, W, H);
      img.src = src;
    }
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingNow.current = true;
    const p = point(e);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "pen" ? "#132846" : "#ffffff";
    ctx.lineWidth = tool === "pen" ? 2.5 : 22;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingNow.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function end() {
    if (!drawingNow.current) return;
    drawingNow.current = false;
    const url = canvasRef.current?.toDataURL("image/png") ?? null;
    setDrawing(url);
    dirty.current = true;
  }

  function clear() {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
    }
    setDrawing(null);
    dirty.current = true;
  }

  return (
    <Drawer
      open={open}
      onClose={() => {
        void save();
        onClose();
      }}
      title="Scratchpad"
      widthClass="sm:max-w-xl"
      footer={
        <p className="text-xs text-mute" aria-live="polite">
          <span className="font-medium text-warning">Not graded.</span> Only you can see this.{" "}
          {error ? <span className="text-danger">{error}</span> : savedAt ? `Saved at ${fmtTime(savedAt)}.` : "Saves automatically every few seconds."}
        </p>
      }
    >
      <Tabs
        items={[
          { value: "text", label: "Text" },
          { value: "draw", label: "Draw" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "text" ? (
        <div className="mt-4">
          <label htmlFor="scratch-text" className="sr-only">
            Scratchpad notes
          </label>
          <textarea
            id="scratch-text"
            value={text}
            maxLength={20000}
            onChange={(e) => {
              setText(e.target.value);
              dirty.current = true;
            }}
            placeholder="Rough work, calculations, reminders…"
            className="min-h-[50vh] w-full resize-y rounded-md border border-line bg-paper px-4 py-3 text-[0.9375rem] leading-relaxed text-ink focus:border-cobalt"
          />
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-3 flex gap-2" role="toolbar" aria-label="Drawing tools">
            {(["pen", "eraser"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tool === t}
                onClick={() => setTool(t)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[0.8125rem]",
                  tool === t ? "border-cobalt bg-tint text-cobalt" : "border-line text-ink hover:bg-sand",
                )}
              >
                {t === "pen" ? <PenLine className="size-4" /> : <Eraser className="size-4" />}
                {t === "pen" ? "Pen" : "Eraser"}
              </button>
            ))}
            <button type="button" onClick={clear} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[0.8125rem] text-danger hover:bg-danger-soft">
              <Trash2 className="size-4" /> Clear
            </button>
          </div>
          <canvas
            ref={attachCanvas}
            width={W}
            height={H}
            aria-label="Drawing area"
            className="w-full touch-none rounded-md border border-line bg-white"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>
      )}
    </Drawer>
  );
}
