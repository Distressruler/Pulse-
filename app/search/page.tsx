"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound } from "lucide-react";

import { supabase } from "@/lib/supabase";

import {
  followUser,
  getFollowing,
  unfollowUser,
} from "@/lib/services/follows";

import type {
  Follow,
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

function SearchHeaderSkeleton() {
  return (
    <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-12 w-12 rounded-full" />

        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-28" />
          <SkeletonBlock className="h-4 w-40" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <SkeletonBlock className="h-12 flex-1 rounded-full" />
        <SkeletonBlock className="h-12 w-full rounded-full sm:w-28" />
      </div>
    </section>
  );
}

function UserCardSkeleton() {
  return (
    <article className="flex items-center justify-between gap-4 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />

        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-3 w-10/12" />
        </div>
      </div>

      <SkeletonBlock className="h-9 w-24 shrink-0 rounded-full" />
    </article>
  );
}

function SearchPageSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <NavigationSkeleton />
        <SearchHeaderSkeleton />

        <section className="mt-6 space-y-3">
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
        </section>
      </div>
    </main>
  );
}

function SearchResultsSkeleton() {
  return (
    <section className="mt-6 space-y-3">
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
    </section>
  );
}

export default function SearchPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [updatingUserId, setUpdatingUserId] =
    useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        router.refresh();
        return;
      }

      setCurrentUserId(user.id);

      try {
        const loadedFollowing = await getFollowing(
          user.id
        );

        setFollowing(loadedFollowing);
      } catch (loadError) {
        setMessage(
          loadError instanceof Error
            ? loadError.message
            : "Could not load following data."
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadPage();
  }, [router]);

  async function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setUsers([]);
      setMessage("Enter a username to search.");
      return;
    }

    try {
      setSearching(true);
      setUsers([]);
      setMessage("");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, bio, avatar_url, created_at"
        )
        .neq("id", currentUserId)
        .ilike("username", `%${cleanQuery}%`)
        .order("username", { ascending: true })
        .limit(20);

      if (error) {
        throw new Error(error.message);
      }

      setUsers(data ?? []);

      if (!data || data.length === 0) {
        setMessage("No users found.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not search users."
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleToggleFollow(
    targetUserId: string
  ) {
    const alreadyFollowing = following.some(
      (follow) =>
        follow.following_id === targetUserId
    );

    try {
      setUpdatingUserId(targetUserId);
      setMessage("");

      if (alreadyFollowing) {
        await unfollowUser(
          currentUserId,
          targetUserId
        );

        setFollowing((current) =>
          current.filter(
            (follow) =>
              follow.following_id !== targetUserId
          )
        );
      } else {
        await followUser(
          currentUserId,
          targetUserId
        );

        setFollowing((current) => [
          ...current,
          {
            follower_id: currentUserId,
            following_id: targetUserId,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update follow status."
      );
    } finally {
      setUpdatingUserId("");
    }
  }

  if (pageLoading) {
    return <SearchPageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">

        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-500">
              <Search size={22} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Search
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Find people on Pulse.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400"
              />

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search username..."
                className="w-full rounded-full border border-pink-100 bg-pink-50 py-3 pl-12 pr-5 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
              />
            </div>

            <button
              type="submit"
              disabled={searching}
              className="rounded-full bg-pink-500 px-7 py-3 font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>
        </section>

        {message && (
          <p className="mt-4 rounded-2xl border border-pink-100 bg-white p-4 text-sm font-medium text-gray-600 shadow-sm">
            {message}
          </p>
        )}

        {searching ? (
          <SearchResultsSkeleton />
        ) : (
          <section className="mt-6 space-y-3">
            {users.map((user) => {
              const alreadyFollowing = following.some(
                (follow) =>
                  follow.following_id === user.id
              );

              const updating =
                updatingUserId === user.id;

              const userName =
                user.username ??
                user.display_name ??
                "pulse-user";

              return (
                <article
                  key={user.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/profile/${user.id}`
                      )
                    }
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-100 font-bold text-pink-500">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={`${userName}'s avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound size={21} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 transition hover:text-pink-500">
                        @
                        {user.username ??
                          "pulse-user"}
                      </p>

                      {user.display_name && (
                        <p className="mt-1 truncate text-sm text-gray-500">
                          {user.display_name}
                        </p>
                      )}

                      {user.bio && (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      handleToggleFollow(user.id)
                    }
                    className={
                      alreadyFollowing
                        ? "shrink-0 rounded-full border border-pink-200 bg-white px-5 py-2 text-sm font-semibold text-pink-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        : "shrink-0 rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:opacity-50"
                    }
                  >
                    {updating
                      ? "..."
                      : alreadyFollowing
                        ? "Unfollow"
                        : "Follow"}
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}