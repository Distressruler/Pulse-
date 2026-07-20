import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/social";

export async function getProfile(
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, created_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProfiles(
  userIds: string[]
): Promise<Record<string, Profile>> {
  if (userIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, created_at"
    )
    .in("id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  const profileMap: Record<string, Profile> = {};

  for (const profile of data ?? []) {
    profileMap[profile.id] = profile;
  }

  return profileMap;
}