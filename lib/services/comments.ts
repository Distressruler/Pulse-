import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types/social";

export async function getComments(
  postIds: number[]
): Promise<Comment[]> {
  if (postIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author_id, content, created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createComment(
  postId: number,
  authorId: string,
  content: string
): Promise<void> {
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: authorId,
    content,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteComment(
  commentId: number
): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    throw new Error(error.message);
  }
}