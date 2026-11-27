// Validation rules shared by the backend (API) and the frontend (forms).
// They follow the "Validation rules" table in docs/CONTRACT.md exactly.
// Backend: schema.parse(body) throws a ZodError -> withErrors turns it into a 400 with `fields`.
// Frontend: schema.safeParse(values) and show each issue under its input.
import { z } from "zod";

// ---------- small building blocks ----------

export const uuid = z.uuid("Invalid id");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, "Email must be at most 120 characters")
  .pipe(z.email("Enter a valid email address"));

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .refine((v) => /[A-Za-z]/.test(v), "Password needs at least 1 letter")
  .refine((v) => /\d/.test(v), "Password needs at least 1 number");

const fullName = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters");

/** At most 2 decimal places (avoids float noise like 0.1 + 0.2). */
const twoDecimals = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;

const role = z.enum(["admin", "examiner", "candidate"], "Choose a role");
const difficulty = z.enum(["easy", "medium", "hard"], "Choose a difficulty");
const questionType = z.enum(["mcq_single", "mcq_multi", "written"], "Choose a question type");
const multiScheme = z.enum(["all_or_nothing", "partial"], "Choose a marking scheme");

// ---------- auth & users ----------

export const signupSchema = z.object({ fullName, email, password });
/** Login only checks the fields are present: the password rules apply when the password is created. */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(72, "Password is too long"),
});
export const createUserSchema = z.object({ fullName, email, password, role });
export const updateUserSchema = z
  .object({ role: role.optional(), isActive: z.boolean("Must be true or false").optional() })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, "Send a role or isActive to change");

// ---------- topics & questions ----------

export const topicSchema = z.object({
  name: z.string().trim().min(2, "Topic name must be at least 2 characters").max(60, "Topic name must be at most 60 characters"),
});

const optionSchema = z.object({
  label: z.string().trim().min(1, "Option text is required").max(500, "Option text must be at most 500 characters"),
  isCorrect: z.boolean(),
});

export const questionSchema = z
  .object({
    topicId: uuid,
    type: questionType,
    stem: z.string().trim().min(5, "Question must be at least 5 characters").max(2000, "Question must be at most 2000 characters"),
    difficulty,
    marks: z
      .number("Marks must be a number")
      .gt(0, "Marks must be more than 0")
      .max(100, "Marks must be at most 100")
      .refine(twoDecimals, "Marks can have at most 2 decimals"),
    multiScheme: multiScheme.default("all_or_nothing"),
    negativeMarks: z
      .number("Negative marks must be a number")
      .min(0, "Negative marks can't be below 0")
      .refine(twoDecimals, "Negative marks can have at most 2 decimals")
      .default(0),
    options: z.array(optionSchema).default([]),
  })
  .superRefine((q, ctx) => {
    const add = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (q.negativeMarks > q.marks) add("negativeMarks", "Negative marks can't be more than the question marks");

    const correct = q.options.filter((o) => o.isCorrect).length;
    if (q.type === "written") {
      if (q.options.length > 0) add("options", "Written questions have no options");
      return;
    }
    if (q.options.length < 2 || q.options.length > 6) add("options", "Add between 2 and 6 options");
    if (q.type === "mcq_single" && correct !== 1) add("options", "Mark exactly 1 option as correct");
    if (q.type === "mcq_multi" && correct < 1) add("options", "Mark at least 1 option as correct");
    const labels = q.options.map((o) => o.label.toLowerCase());
    if (new Set(labels).size !== labels.length) add("options", "Options must be different from each other");
  });

// ---------- exams ----------

const dateString = (label: string) =>
  z.string(`${label} is required`).refine((v) => !Number.isNaN(Date.parse(v)), `${label} must be a valid date`);

/** Exam fields WITHOUT defaults, so a PATCH never resets a field the user did not send. */
const examShape = {
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title must be at most 120 characters"),
  instructions: z.string().max(5000, "Instructions must be at most 5000 characters"),
  startAt: dateString("Start time"),
  endAt: dateString("End time"),
  durationMin: z
    .number("Duration must be a number")
    .int("Duration must be a whole number of minutes")
    .min(1, "Duration must be at least 1 minute")
    .max(600, "Duration must be at most 600 minutes"),
  totalMarks: z.number("Total marks must be a number").gt(0, "Total marks must be more than 0").refine(twoDecimals, "At most 2 decimals"),
  passMarks: z.number("Pass marks must be a number").min(0, "Pass marks can't be below 0").refine(twoDecimals, "At most 2 decimals"),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
};

/** Create: instructions and shuffles are optional (defaults). */
export const examFieldsSchema = z.object({
  ...examShape,
  instructions: examShape.instructions.default(""),
  shuffleQuestions: examShape.shuffleQuestions.default(true),
  shuffleOptions: examShape.shuffleOptions.default(true),
});

type ExamFields = z.infer<typeof examFieldsSchema>;

/** Rules that compare fields with each other (shared by create and by the merged PATCH). */
function checkExam(e: ExamFields, ctx: z.RefinementCtx) {
  const add = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  const start = Date.parse(e.startAt);
  const end = Date.parse(e.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return; // already reported by the field rules
  if (end <= start) {
    add("endAt", "End time must be after the start time");
  } else if (e.durationMin > (end - start) / 60000) {
    add("durationMin", "Duration can't be longer than the time between start and end");
  }
  if (e.passMarks > e.totalMarks) add("passMarks", "Pass marks can't be more than total marks");
}

export const examSchema = examFieldsSchema.superRefine(checkExam);
/** PATCH: any subset of fields. The service merges it with the saved exam and re-checks with examSchema. */
export const examPatchSchema = z.object(examShape).partial();

// ---------- helpers for the backend ----------

/** Query-string text that is empty counts as "not given". */
export const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));
