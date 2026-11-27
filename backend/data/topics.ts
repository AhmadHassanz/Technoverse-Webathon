// DATA layer for topics.
import { adminClient } from "@/backend/lib/supabase";
import type { Topic } from "@/shared/types";

type TopicRow = { id: string; name: string; created_by: string; questions: { count: number }[] };

const toTopic = (r: TopicRow): Topic => ({ id: r.id, name: r.name, questionCount: r.questions?.[0]?.count ?? 0 });

/** `ownerId` = only that user's topics; undefined = all topics (admin). */
export async function listTopics(ownerId?: string): Promise<Topic[]> {
  let query = adminClient().from("topics").select("id, name, created_by, questions(count)").order("name");
  if (ownerId) query = query.eq("created_by", ownerId);
  const { data, error } = await query.returns<TopicRow[]>();
  if (error) throw error;
  return data.map(toTopic);
}

export async function findTopic(id: string): Promise<{ id: string; name: string; createdBy: string } | null> {
  const { data, error } = await adminClient().from("topics").select("id, name, created_by").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, name: data.name, createdBy: data.created_by } : null;
}

export async function insertTopic(name: string, createdBy: string) {
  const { data, error } = await adminClient().from("topics").insert({ name, created_by: createdBy }).select("id, name").single();
  return { topic: data ? ({ id: data.id, name: data.name, questionCount: 0 } satisfies Topic) : null, error };
}
