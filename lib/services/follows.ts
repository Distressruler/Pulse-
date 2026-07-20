import { supabase } from "@/lib/supabase";
import type { Follow } from "@/types/social";

export async function getFollowing(
  userId: string
): Promise<Follow[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, following_id, created_at")
    .eq("follower_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getFollowers(
  userId: string
): Promise<Follow[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, following_id, created_at")
    .eq("following_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  if (currentUserId === targetUserId) {
    throw new Error("You cannot follow yourself.");
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: currentUserId,
    following_id: targetUserId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function isFollowingUser(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}