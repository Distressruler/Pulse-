"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import {
  getFollowers,
  getFollowing,
} from "@/lib/services/follows";

type FollowListType =
  | "followers"
  | "following";

type FollowProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type FollowListModalProps = {
  profileId: string;
  type: FollowListType;
  onClose: () => void;
};

export default function FollowListModal({
  profileId,
  type,
  onClose,
}: FollowListModalProps) {
  const router = useRouter();

  const [profiles, setProfiles] =
    useState<FollowProfile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadProfiles = useCallback(
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const follows =
          type === "followers"
            ? await getFollowers(profileId)
            : await getFollowing(profileId);

        const userIds = follows.map(
          (follow) =>
            type === "followers"
              ? follow.follower_id
              : follow.following_id
        );

        if (userIds.length === 0) {
          setProfiles([]);
          return;
        }

        const { data, error } =
          await supabase
            .from("profiles")
            .select(
              "id, username, display_name, avatar_url"
            )
            .in("id", userIds);

        if (error) {
          throw new Error(error.message);
        }

        setProfiles(data ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load users."
        );
      } finally {
        setLoading(false);
      }
    },
    [profileId, type]
  );

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  function openProfile(userId: string) {
    onClose();
    router.push(`/profile/${userId}`);
  }

  const title =
    type === "followers"
      ? "Followers"
      : "Following";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[75vh] w-full max-w-md overflow-hidden rounded-t-3xl border border-pink-100 bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-gray-600 transition hover:bg-pink-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-pink-500">
              <LoaderCircle
                size={28}
                className="animate-spin"
              />
            </div>
          ) : errorMessage ? (
            <p className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
              {errorMessage}
            </p>
          ) : profiles.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-pink-400">
                <UserRound size={25} />
              </div>

              <p className="mt-4 font-semibold text-gray-900">
                No {title.toLowerCase()} yet
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {profiles.map((user) => {
                const displayedName =
                  user.display_name ||
                  user.username ||
                  "Pulse user";

                const firstLetter =
                  displayedName
                    .charAt(0)
                    .toUpperCase();

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() =>
                      openProfile(user.id)
                    }
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-pink-50"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={displayedName}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-500">
                        {firstLetter}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {displayedName}
                      </p>

                      <p className="truncate text-sm text-gray-500">
                        @
                        {user.username ||
                          "pulse-user"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}