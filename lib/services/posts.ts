import { supabase } from "@/lib/supabase";
import type { Post } from "@/types/social";

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, author_id, content, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createPost(
  authorId: string,
  content: string
): Promise<void> {
  const { error } = await supabase.from("posts").insert({
    author_id: authorId,
    content,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePost(
  postId: number
): Promise<void> {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }
}