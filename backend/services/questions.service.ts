// SERVICE layer for topics and the question bank.
// Rule: examiners see/change only their own; admins can do everything.
import { assertOwner } from "@/backend/lib/auth";
import { HttpError } from "@/backend/lib/errors";
import { isUniqueViolation } from "@/backend/lib/http";
import { findTopic, insertTopic, listTopics } from "@/backend/data/topics";
import {
  deleteQuestion, findQuestion, insertQuestion, isQuestionInUse, listQuestions, replaceQuestion,
  type QuestionFilter,
} from "@/backend/data/questions";
import type { Me, OkResult, Question, QuestionInput, Topic } from "@/shared/types";

const ownerFilter = (user: Me) => (user.role === "admin" ? undefined : user.id);

export function getTopics(user: Me): Promise<Topic[]> {
  return listTopics(ownerFilter(user));
}

export async function createTopic(user: Me, name: string): Promise<Topic> {
  const { topic, error } = await insertTopic(name, user.id);
  if (isUniqueViolation(error)) throw new HttpError(409, "You already have a topic with this name", { name: "Already exists" });
  if (error || !topic) throw error ?? new Error("Topic was not created");
  return topic;
}

export function getQuestions(user: Me, filter: Omit<QuestionFilter, "ownerId">): Promise<Question[]> {
  return listQuestions({ ...filter, ownerId: ownerFilter(user) });
}

/** Load a question and check the caller may touch it (404 / 403). */
async function loadOwned(user: Me, id: string): Promise<Question> {
  const found = await findQuestion(id);
  if (!found) throw new HttpError(404, "Question not found");
  assertOwner(user, found.createdBy);
  return found.question;
}

/** The chosen topic must exist and belong to the caller. */
async function checkTopic(user: Me, topicId: string) {
  const topic = await findTopic(topicId);
  if (!topic) throw new HttpError(400, "Topic not found", { topicId: "Choose an existing topic" });
  if (user.role !== "admin" && topic.createdBy !== user.id) {
    throw new HttpError(400, "Topic not found", { topicId: "Choose one of your own topics" });
  }
}

export function getQuestion(user: Me, id: string): Promise<Question> {
  return loadOwned(user, id);
}

export async function createQuestion(user: Me, input: QuestionInput): Promise<Question> {
  await checkTopic(user, input.topicId);
  const id = await insertQuestion(input, user.id);
  return loadOwned(user, id);
}

/** Editing replaces all options. Old attempts are safe: they keep their own frozen snapshot. */
export async function updateQuestion(user: Me, id: string, input: QuestionInput): Promise<Question> {
  await loadOwned(user, id);
  await checkTopic(user, input.topicId);
  await replaceQuestion(id, input);
  return loadOwned(user, id);
}

export async function removeQuestion(user: Me, id: string): Promise<OkResult> {
  await loadOwned(user, id);
  const inUse = "This question is used in an exam, so it can't be deleted";
  if (await isQuestionInUse(id)) throw new HttpError(409, inUse);
  const { error } = await deleteQuestion(id);
  if (error?.code === "23503") throw new HttpError(409, inUse);
  if (error) throw error;
  return { ok: true };
}
