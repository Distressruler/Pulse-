"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Send,
  Users,
} from "lucide-react";

import AppNav from "@/components/navigation/AppNav";
import { supabase } from "@/lib/supabase";

export default function MessagesPage() {
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
            Loading messages...
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
              <MessageCircle size={23} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Messages
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Private conversations with other Pulse users.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-400">
            <MessageCircle size={30} strokeWidth={2} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            No conversations yet
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Start following people and you'll be able to chat with them once messaging is enabled.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-400">
              <Send size={18} />
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-400">
              <Users size={18} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}