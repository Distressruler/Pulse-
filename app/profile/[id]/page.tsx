"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  CalendarDays,
  FileText,
  LoaderCircle,
  MessageCircle,
  Pencil,
  UserPlus,
  UserRound,
} from "lucide-react";

import AppNav from "@/components/navigation/AppNav";
import { supabase } from "@/lib/supabase";

import {
  followUser,
  getFollowers,
  getFollowing,
  isFollowingUser,
  unfollowUser,
} from "@/lib/services/follows";

import {
  createDirectConversation,
} from "@/lib/services/messages";

import type {
  Post,
  Profile,
} from "@/types/social";

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-pink-100 ${className}`}
    />
  );
}

function NavigationSkeleton() {
  return (
    <div className="mb-6 flex items-center justify-between rounded-3xl border border-pink-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <SkeletonBlock className="h-5 w-24" />
      </div>

      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9 rounded-full" />
        <SkeletonBlock className="h-9 w-9 rounded-full" />
        <SkeletonBlock className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <section className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
      <SkeletonBlock className="h-28 w-full rounded-none" />

      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-full border-4 border-white bg-white shadow-sm">
              <SkeletonBlock className="h-24 w-24 rounded-full" />
            </div>

            <div className="space-y-2 pb-1">
              <SkeletonBlock className="h-6 w-40" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
          </div>

          <div className="flex gap-3">
            <SkeletonBlock className="h-10 w-28 rounded-full" />
            <SkeletonBlock className="h-10 w-28 rounded-full" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-10/12" />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <SkeletonBlock className="h-4 w-4 rounded-full" />
          <SkeletonBlock className="h-4 w-32" />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-pink-100 pt-5">
          <div className="rounded-2xl bg-pink-50 p-4">
            <SkeletonBlock className="mx-auto h-6 w-10" />
            <SkeletonBlock className="mx-auto mt-2 h-3 w-12" />
          </div>

          <div className="rounded-2xl bg-pink-50 p-4">
            <SkeletonBlock className="mx-auto h-6 w-10" />
            <SkeletonBlock className="mx-auto mt-2 h-3 w-16" />
          </div>

          <div className="rounded-2xl bg-pink-50 p-4">
            <SkeletonBlock className="mx-auto h-6 w-10" />
            <SkeletonBlock className="mx-auto mt-2 h-3 w-16" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PostsHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-10 w-10 rounded-full" />

      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-20" />
        <SkeletonBlock className="h-4 w-44" />
      </div>
    </div>
  );
}

function ProfilePostSkeleton() {
  return (
    <article className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />

        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-11/12" />
        <SkeletonBlock className="h-4 w-8/12" />
      </div>

      <SkeletonBlock className="mt-5 h-3 w-32" />
    </article>
  );
}

function ProfilePageSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <NavigationSkeleton />
        <ProfileHeaderSkeleton />

        <section className="mt-8">
          <PostsHeaderSkeleton />

          <div className="mt-5 space-y-4">
            <ProfilePostSkeleton />
            <ProfilePostSkeleton />
            <ProfilePostSkeleton />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();

  const profileId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [followersCount, setFollowersCount] =
    useState(0);

  const [followingCount, setFollowingCount] =
    useState(0);

  const [
    followingProfile,
    setFollowingProfile,
  ] = useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [followLoading, setFollowLoading] =
    useState(false);

  const [messageLoading, setMessageLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const loadProfilePage = useCallback(
    async (loggedInUserId: string) => {
      if (!profileId) {
        setMessage("Profile ID is missing.");
        return;
      }

      try {
        setMessage("");

        const {
          data: loadedProfile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, username, display_name, bio, avatar_url, created_at"
          )
          .eq("id", profileId)
          .single();

        if (profileError) {
          throw new Error(
            profileError.message
          );
        }

        setProfile(loadedProfile);

        const {
          data: loadedPosts,
          error: postsError,
        } = await supabase
          .from("posts")
          .select(
            "id, author_id, content, created_at"
          )
          .eq("author_id", profileId)
          .order("created_at", {
            ascending: false,
          });

        if (postsError) {
          throw new Error(
            postsError.message
          );
        }

        setPosts(loadedPosts ?? []);

        const [followers, following] =
          await Promise.all([
            getFollowers(profileId),
            getFollowing(profileId),
          ]);

        setFollowersCount(
          followers.length
        );

        setFollowingCount(
          following.length
        );

        if (loggedInUserId !== profileId) {
          const followStatus =
            await isFollowingUser(
              loggedInUserId,
              profileId
            );

          setFollowingProfile(
            followStatus
          );
        } else {
          setFollowingProfile(false);
        }
      } catch (error) {
        setProfile(null);

        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load this profile."
        );
      }
    },
    [profileId]
  );

  useEffect(() => {
    async function loadPage() {
      if (profileId === "edit") {
        router.replace("/edit-profile");
        return;
      }

      try {
        setPageLoading(true);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.replace("/login");
          return;
        }

        setCurrentUserId(user.id);

        await loadProfilePage(user.id);
      } finally {
        setPageLoading(false);
      }
    }

    loadPage();
  }, [
    loadProfilePage,
    profileId,
    router,
  ]);

  async function handleToggleFollow() {
    if (!currentUserId || !profileId) {
      return;
    }

    try {
      setFollowLoading(true);
      setMessage("");

      if (followingProfile) {
        await unfollowUser(
          currentUserId,
          profileId
        );

        setFollowingProfile(false);

        setFollowersCount((count) =>
          Math.max(0, count - 1)
        );
      } else {
        await followUser(
          currentUserId,
          profileId
        );

        setFollowingProfile(true);

        setFollowersCount(
          (count) => count + 1
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update follow status."
      );
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleOpenMessage() {
    if (
      !currentUserId ||
      !profileId ||
      currentUserId === profileId ||
      messageLoading
    ) {
      return;
    }

    try {
      setMessageLoading(true);
      setMessage("");

      const conversationId =
        await createDirectConversation(
          currentUserId,
          profileId
        );

      router.push(
        `/messages/${conversationId}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not open the conversation."
      );

      setMessageLoading(false);
    }
  }

  if (
    pageLoading ||
    profileId === "edit"
  ) {
    return <ProfilePageSkeleton />;
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 text-gray-900">
        <div className="w-full max-w-md rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-500">
            <UserRound size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Profile not found
          </h1>

          {message && (
            <p className="mt-3 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              router.push("/feed")
            }
            className="mt-6 rounded-full bg-pink-500 px-6 py-3 font-semibold text-white transition hover:bg-pink-600"
          >
            Return to Feed
          </button>
        </div>
      </main>
    );
  }

  const ownProfile =
    currentUserId === profile.id;

  const displayedName =
    profile.display_name ||
    profile.username ||
    "Pulse user";

  const firstLetter = displayedName
    .charAt(0)
    .toUpperCase();

  const joinedDate = profile.created_at
    ? new Date(
        profile.created_at
      ).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AppNav
          currentUserId={currentUserId}
        />

        {message && (
          <p className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
            {message}
          </p>
        )}

        <section className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-pink-200 via-rose-100 to-pink-100" />

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="rounded-full border-4 border-white bg-white shadow-sm">
                  {profile.avatar_url ? (
                    <img
                      src={
                        profile.avatar_url
                      }
                      alt={displayedName}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-pink-100 text-3xl font-bold text-pink-500">
                      {firstLetter}
                    </div>
                  )}
                </div>

                <div className="pb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {displayedName}
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    @
                    {profile.username ??
                      "pulse-user"}
                  </p>
                </div>
              </div>

              {ownProfile ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/edit-profile"
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-full border border-pink-200 bg-white px-5 py-2.5 text-sm font-semibold text-pink-500 transition hover:bg-pink-50"
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex w-full gap-3 sm:w-auto">
                  <button
                    type="button"
                    disabled={followLoading}
                    onClick={
                      handleToggleFollow
                    }
                    className={
                      followingProfile
                        ? "flex flex-1 items-center justify-center gap-2 rounded-full border border-pink-200 bg-white px-5 py-2.5 text-sm font-semibold text-pink-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        : "flex flex-1 items-center justify-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    }
                  >
                    <UserPlus size={16} />

                    {followLoading
                      ? "Updating..."
                      : followingProfile
                        ? "Unfollow"
                        : "Follow"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleOpenMessage
                    }
                    disabled={messageLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-pink-200 bg-white px-5 py-2.5 text-sm font-semibold text-pink-500 transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {messageLoading ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <MessageCircle
                        size={16}
                      />
                    )}

                    {messageLoading
                      ? "Opening..."
                      : "Message"}
                  </button>
                </div>
              )}
            </div>

            {profile.bio ? (
              <p className="mt-6 whitespace-pre-wrap break-words leading-7 text-gray-700">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-6 text-sm text-gray-400">
                {ownProfile
                  ? "Add a bio to tell people about yourself."
                  : "No bio added yet."}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays
                size={16}
                className="text-pink-400"
              />

              Joined {joinedDate}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-pink-100 pt-5">
              <div className="rounded-2xl bg-pink-50 p-4 text-center">
                <p className="text-xl font-bold text-gray-900">
                  {posts.length}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  Posts
                </p>
              </div>

              <div className="rounded-2xl bg-pink-50 p-4 text-center">
                <p className="text-xl font-bold text-gray-900">
                  {followersCount}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  Followers
                </p>
              </div>

              <div className="rounded-2xl bg-pink-50 p-4 text-center">
                <p className="text-xl font-bold text-gray-900">
                  {followingCount}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  Following
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-500">
              <FileText size={19} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Posts
              </h2>

              <p className="text-sm text-gray-500">
                Recent posts from this
                profile.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-pink-400">
                  <FileText size={24} />
                </div>

                <h3 className="mt-4 font-bold text-gray-900">
                  No posts yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {ownProfile
                    ? "Your posts will appear here after you publish them."
                    : "This user has not posted anything yet."}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={
                          profile.avatar_url
                        }
                        alt={displayedName}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-500">
                        {firstLetter}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {displayedName}
                      </p>

                      <p className="text-sm text-gray-500">
                        @
                        {profile.username ??
                          "pulse-user"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-gray-700">
                    {post.content}
                  </p>

                  <p className="mt-4 text-xs text-gray-400">
                    {new Date(
                      post.created_at
                    ).toLocaleString()}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}