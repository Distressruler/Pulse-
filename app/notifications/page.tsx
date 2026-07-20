"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";

import AppNav from "@/components/navigation/AppNav";
import { supabase } from "@/lib/supabase";

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
      } = await supabase.auth.getUser();

      if (!user) {
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50 text-gray-900">
        <div className="rounded-2xl border border-pink-100 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm font-medium text-pink-500">
            Loading notifications...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AppNav currentUserId={currentUserId} />

        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-500">
              <Bell size={23} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Likes, comments, and new followers will appear here.
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
            When someone follows you, likes your post, or leaves a comment,
            you’ll see it here.
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