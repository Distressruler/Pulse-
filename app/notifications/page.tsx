"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type NotificationRow = {
  id: string;
  actor_id: string;
  type: "follow" | "like" | "comment";
  post_id: number | null;
  is_read: boolean;
  created_at: string;
};



type NotificationItem = NotificationRow & {
  actor: ActorProfile | null;
};
type ActorProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};
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

function NotificationCardSkeleton() {
  return (
    <article className="flex items-start gap-4 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
      <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1 space-y-3">
        <SkeletonBlock className="h-4 w-11/12" />
        <SkeletonBlock className="h-3 w-24" />
      </div>
    </article>
  );
}

function NotificationsPageSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <SkeletonBlock className="h-32 w-full rounded-3xl" />

        <section className="mt-6 space-y-3">
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
        </section>
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadNotifications() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        router.refresh();
        return;
      }

      const {
        data: notificationRows,
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .select(
          "id, actor_id, type, post_id, is_read, created_at"
        )
        .eq("recipient_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (notificationsError) {
        setErrorMessage(notificationsError.message);
        setPageLoading(false);
        return;
      }

      const rows =
        (notificationRows as NotificationRow[]) ?? [];

      const actorIds = [
        ...new Set(rows.map((item) => item.actor_id)),
      ];

      let profiles: ActorProfile[] = [];

      if (actorIds.length > 0) {
        const {
          data: profileRows,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(
            "id, username, avatar_url"
          )
          .in("id", actorIds);

        if (profilesError) {
          setErrorMessage(profilesError.message);
          setPageLoading(false);
          return;
        }

        profiles =
          (profileRows as ActorProfile[]) ?? [];
      }

      const profileMap = new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ])
      );

      const combined: NotificationItem[] =
        rows.map((notification) => ({
          ...notification,
          actor:
            profileMap.get(notification.actor_id) ??
            null,
        }));

      setNotifications(combined);

      const unreadIds = rows
        .filter((notification) => !notification.is_read)
        .map((notification) => notification.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .in("id", unreadIds)
          .eq("recipient_id", user.id);
      }

      setPageLoading(false);
    }

    loadNotifications();
  }, [router]);

  if (pageLoading) {
    return <NotificationsPageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-500">
              <Bell size={23} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Likes, comments, and new followers
                will appear here.
              </p>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-6 rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
            <p className="font-medium text-red-500">
              {errorMessage}
            </p>
          </section>
        ) : notifications.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-400">
              <Bell size={28} strokeWidth={2} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No notifications yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              When someone follows you, likes your post,
              or leaves a comment, you’ll see it here.
            </p>
          </section>
        ) : (
          <section className="mt-6 space-y-3">
            {notifications.map((notification) => {
             const actorName =
           notification.actor?.username ??
               "Someone";
              const username =
                notification.actor?.username ??
                "pulse-user";

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/profile/${notification.actor_id}`
                    )
                  }
                  className="flex w-full items-start gap-4 rounded-3xl border border-pink-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                >
                  {notification.actor?.avatar_url ? (
                    <img
                      src={
                        notification.actor.avatar_url
                      }
                      alt={actorName}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-500">
                      {actorName
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                   <p className="leading-6 text-gray-700">
  <span className="font-bold text-gray-900">
    {actorName}
  </span>{" "}
  {notification.type === "follow" &&
    "followed you."}

  {notification.type === "like" &&
    "liked your post."}

  {notification.type === "comment" &&
    "commented on your post."}
</p>

                    <p className="mt-1 text-sm text-gray-500">
                      @{username}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(
                        notification.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-500">
  {notification.type === "follow" && (
    <UserPlus size={19} />
  )}

  {notification.type === "like" && (
    <Heart size={19} />
  )}

  {notification.type === "comment" && (
    <MessageCircle size={19} />
  )}
</div>
                </button>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}