"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";

import AppNav from "@/components/navigation/AppNav";
import { supabase } from "@/lib/supabase";

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

function NotificationsHeaderSkeleton() {
  return (
    <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-12 w-12 rounded-full" />

        <div className="flex-1 space-y-3">
          <SkeletonBlock className="h-7 w-44" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
      </div>
    </section>
  );
}

function NotificationCardSkeleton() {
  return (
    <article className="flex items-start gap-4 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
      <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1 space-y-3">
        <SkeletonBlock className="h-4 w-11/12" />
        <SkeletonBlock className="h-4 w-8/12" />
        <SkeletonBlock className="h-3 w-24" />
      </div>

      <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
    </article>
  );
}

function NotificationsPageSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <NavigationSkeleton />
        <NotificationsHeaderSkeleton />

        <section className="mt-6 space-y-3">
          <NotificationCardSkeleton />
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

  const [currentUserId, setCurrentUserId] =
    useState("");
  const [pageLoading, setPageLoading] =
    useState(true);

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
      setPageLoading(false);
    }

    loadPage();
  }, [router]);

  if (pageLoading) {
    return <NotificationsPageSkeleton />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AppNav currentUserId={currentUserId} />

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

          <div className="mt-6 flex justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-400">
              <Heart size={18} />
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-400">
              <MessageCircle size={18} />
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-400">
              <UserPlus size={18} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}