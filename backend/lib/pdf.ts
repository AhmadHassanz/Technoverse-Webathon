// Small helper around pdf-lib for the two reports: A4 pages, wrapped text, table rows, page numbers.
// pdf-lib's standard fonts can only draw Latin-1 text, so EVERY string goes through latin1() first
// (otherwise a single Arabic/Urdu/emoji character would crash the whole report).
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";

/** Make text safe for Helvetica: strip accents, replace fancy punctuation, drop anything else with "?". */
export function latin1(input: string): string {
  return input
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

// Same warm charcoal and paper tones as the website ("Quiet Signal" design).
export const colors = {
  text: rgb(0.106, 0.098, 0.094), // ink #1b1918
  muted: rgb(0.42, 0.4, 0.38),
  line: rgb(0.89, 0.87, 0.84),
  head: rgb(0.945, 0.933, 0.91), // table header fill
  zebra: rgb(0.978, 0.973, 0.962), // every second table row
  good: rgb(0.1, 0.45, 0.25),
  goodSoft: rgb(0.89, 0.95, 0.91),
  bad: rgb(0.7, 0.16, 0.14),
  badSoft: rgb(0.98, 0.9, 0.88),
  accent: rgb(0.106, 0.098, 0.094),
  night: rgb(0.122, 0.118, 0.11), // charcoal header bar
  onNight: rgb(0.99, 0.99, 0.98),
  nightMute: rgb(0.65, 0.63, 0.6),
};

type TextOptions = { size?: number; bold?: boolean; color?: RGB; x?: number; width?: number };
export type Cell = { text: string; x: number; width: number; bold?: boolean; color?: RGB };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const LINE = 1.3; // line height = size * LINE
const BAR_H = 34; // charcoal header bar at the top of every page

/** Split text into lines no wider than maxWidth (long words are broken by characters). */
function wrapLines(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  const fits = (s: string) => font.widthOfTextAtSize(s, size) <= maxWidth;
  for (const word of latin1(text).split(" ")) {
    if (word === "") continue;
    const attempt = current ? `${current} ${word}` : word;
    if (fits(attempt)) {
      current = attempt;
      continue;
    }
    if (current) lines.push(current);
    let rest = word;
    while (!fits(rest)) {
      let cut = rest.length - 1;
      while (cut > 1 && !fits(rest.slice(0, cut))) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    current = rest;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export class PdfWriter {
  readonly contentWidth = PAGE_W - MARGIN * 2;
  readonly left = MARGIN;
  private page!: PDFPage;
  private y = 0;

  private constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont,
    private label: string,
  ) {
    this.newPage();
  }

  /** `label` is shown at the right of the header bar (for example "Result report"). */
  static async create(title: string, label = ""): Promise<PdfWriter> {
    const doc = await PDFDocument.create();
    doc.setTitle(latin1(title));
    doc.setCreator("ExamCore");
    return new PdfWriter(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold), latin1(label));
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    // Charcoal bar with the ExamCore mark (four squares, the last one faded) and the report type.
    this.page.drawRectangle({ x: 0, y: PAGE_H - BAR_H, width: PAGE_W, height: BAR_H, color: colors.night });
    const sq = 6;
    const top = PAGE_H - BAR_H / 2 + sq + 1;
    const squares: [number, number, number][] = [[0, 0, 1], [sq + 2, 0, 1], [0, sq + 2, 1], [sq + 2, sq + 2, 0.35]];
    for (const [dx, dy, op] of squares) {
      this.page.drawRectangle({ x: MARGIN + dx, y: top - sq - dy, width: sq, height: sq, color: colors.onNight, opacity: op });
    }
    this.page.drawText("examcore", { x: MARGIN + 22, y: PAGE_H - BAR_H / 2 - 4, size: 13, font: this.bold, color: colors.onNight });
    if (this.label) {
      const w = this.font.widthOfTextAtSize(this.label, 9);
      this.page.drawText(this.label, { x: PAGE_W - MARGIN - w, y: PAGE_H - BAR_H / 2 - 3, size: 9, font: this.font, color: colors.nightMute });
    }
    this.y = PAGE_H - BAR_H - 34;
  }

  /** A tinted box with a coloured edge, for the score and pass / fail result. */
  callout(lines: { text: string; size: number; bold?: boolean; color?: RGB }[], tint: RGB, bar: RGB) {
    const height = lines.reduce((sum, l) => sum + l.size * LINE, 0) + 18;
    this.ensure(height + 4);
    this.page.drawRectangle({ x: MARGIN, y: this.y - height, width: this.contentWidth, height, color: tint });
    this.page.drawRectangle({ x: MARGIN, y: this.y - height, width: 4, height, color: bar });
    let y = this.y - 9;
    for (const l of lines) {
      y -= l.size * LINE;
      this.page.drawText(latin1(l.text), { x: MARGIN + 16, y: y + 3, size: l.size, font: l.bold ? this.bold : this.font, color: l.color ?? colors.text });
    }
    this.y -= height + 4;
  }

  /** Start a new page when fewer than `height` points are left. */
  ensure(height: number) {
    if (this.y - height < MARGIN + 24) this.newPage();
  }

  space(height: number) {
    this.y -= height;
  }

  rule() {
    this.ensure(10);
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 0.7, color: colors.line });
    this.y -= 10;
  }

  /** Wrapped paragraph. */
  paragraph(text: string, o: TextOptions = {}) {
    const size = o.size ?? 10;
    const font = o.bold ? this.bold : this.font;
    const x = o.x ?? MARGIN;
    for (const line of wrapLines(font, size, text, o.width ?? this.contentWidth - (x - MARGIN))) {
      this.ensure(size * LINE);
      this.y -= size * LINE;
      this.page.drawText(line, { x, y: this.y, size, font, color: o.color ?? colors.text });
    }
  }

  /** One table row: every cell is wrapped; the row is as tall as its tallest cell. */
  row(cells: Cell[], opts: { size?: number; fill?: RGB } = {}) {
    const size = opts.size ?? 9;
    const wrapped = cells.map((c) => wrapLines(c.bold ? this.bold : this.font, size, c.text, c.width - 8));
    const lines = Math.max(...wrapped.map((w) => w.length));
    const height = lines * size * LINE + 8;
    this.ensure(height);
    if (opts.fill) {
      this.page.drawRectangle({ x: MARGIN, y: this.y - height, width: this.contentWidth, height, color: opts.fill });
    }
    cells.forEach((c, i) => {
      wrapped[i].forEach((line, n) => {
        this.page.drawText(line, {
          x: c.x + 4,
          y: this.y - 4 - size * LINE * (n + 1) + 3,
          size,
          font: c.bold ? this.bold : this.font,
          color: c.color ?? colors.text,
        });
      });
    });
    this.y -= height;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 0.4, color: colors.line });
  }

  /** Draw an image (e.g. the QR code) with its top-left corner at the cursor. */
  image(img: PDFImage, size: number, x = MARGIN) {
    this.ensure(size + 6);
    this.page.drawImage(img, { x, y: this.y - size, width: size, height: size });
    this.y -= size + 6;
  }

  embedPng(bytes: Uint8Array): Promise<PDFImage> {
    return this.doc.embedPng(bytes);
  }

  /** Adds "Page x of y" to every page and returns the file. */
  async save(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    const generatedOn = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
    pages.forEach((p, i) => {
      const label = `Page ${i + 1} of ${pages.length}`;
      p.drawText(label, { x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(label, 8), y: 24, size: 8, font: this.font, color: colors.muted });
      p.drawLine({ start: { x: MARGIN, y: 38 }, end: { x: PAGE_W - MARGIN, y: 38 }, thickness: 0.5, color: colors.line });
      p.drawText(`ExamCore - Secure Examination Management System   |   Generated ${generatedOn}`, { x: MARGIN, y: 24, size: 8, font: this.font, color: colors.muted });
    });
    return this.doc.save();
  }
}
