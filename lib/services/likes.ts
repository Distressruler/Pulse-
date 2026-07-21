import { supabase } from "@/lib/supabase";
import type { Like } from "@/types/social";

export async function getLikes(
  postIds: number[]
): Promise<Like[]> {
  if (postIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("likes")
    .select("post_id, user_id")
    .in("post_id", postIds);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function addLike(
  postId: number,
  userId: string
): Promise<void> {
  const { data: post, error: postError } =
    await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

  if (postError) {
    throw new Error(postError.message);
  }

  const { error } = await supabase
    .from("likes")
    .insert({
      post_id: postId,
      user_id: userId,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (post.user_id !== userId) {
    const { error: notificationError } =
      await supabase
        .from("notifications")
        .insert({
          recipient_id: post.user_id,
          actor_id: userId,
          type: "like",
          post_id: postId,
        });

    if (notificationError) {
      throw new Error(
        `Notification error: ${notificationError.message}`
      );
    }
  }
}

export async function removeLike(
  postId: number,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}