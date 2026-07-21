"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  Search,
} from "lucide-react";

import AppNav from "@/components/navigation/AppNav";
import {
  ConversationPreview,
  getConversationPreviews,
} from "@/lib/services/messages";
import { supabase } from "@/lib/supabase";

function MessagesSkeleton() {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center gap-4 border-b border-pink-50 p-5 last:border-b-0"
        >
          <div className="h-14 w-14 shrink-0 rounded-full bg-pink-100" />

          <div className="min-w-0 flex-1">
            <div className="h-4 w-32 rounded-full bg-pink-100" />
            <div className="mt-3 h-3 w-48 max-w-full rounded-full bg-pink-50" />
          </div>

          <div className="h-4 w-12 rounded-full bg-pink-50" />
        </div>
      ))}
    </div>
  );
}

function getDisplayName(
  preview: ConversationPreview
) {
  return (
    preview.otherUser.display_name?.trim() ||
    preview.otherUser.username?.trim() ||
    "Pulse user"
  );
}

function getUsername(
  preview: ConversationPreview
) {
  if (!preview.otherUser.username) {
    return null;
  }

  return `@${preview.otherUser.username}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatConversationTime(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function MessagesPage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] =
    useState("");
  const [conversations, setConversations] =
    useState<ConversationPreview[]>([]);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const loadConversations = useCallback(
    async (
      userId: string,
      showRefreshLoader = false
    ) => {
      if (showRefreshLoader) {
        setRefreshing(true);
      }

      setErrorMessage("");

      try {
        const previews =
          await getConversationPreviews(userId);

        setConversations(previews);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load your conversations."
        );
      } finally {
        setPageLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (error || !user) {
        router.push("/login");
        router.refresh();
        return;
      }

      setCurrentUserId(user.id);
      await loadConversations(user.id);
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [loadConversations, router]);

  function openConversation(
    conversationId: string
  ) {
    router.push(
      `/messages/${conversationId}`
    );
  }

  function refreshConversations() {
    if (!currentUserId || refreshing) {
      return;
    }

    loadConversations(currentUserId, true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {currentUserId ? (
          <AppNav
            currentUserId={currentUserId}
          />
        ) : null}

        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                <MessageCircle
                  size={23}
                  strokeWidth={2.2}
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  Messages
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Your private Pulse conversations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refreshConversations}
              disabled={
                refreshing ||
                pageLoading ||
                !currentUserId
              }
              aria-label="Refresh conversations"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pink-100 bg-pink-50 text-pink-500 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </section>

        {pageLoading ? (
          <MessagesSkeleton />
        ) : errorMessage ? (
          <section className="mt-6 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={27} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Messages could not load
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={refreshConversations}
              className="mt-5 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
            >
              Try again
            </button>
          </section>
        ) : conversations.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-400">
              <MessageCircle
                size={30}
                strokeWidth={2}
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No conversations yet
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Find another Pulse user and start
              your first private conversation.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/search")
              }
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
            >
              <Search size={17} />
              Find people
            </button>
          </section>
        ) : (
          <section className="mt-6 overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
            {conversations.map(
              (conversation) => {
                const displayName =
                  getDisplayName(
                    conversation
                  );
                const username =
                  getUsername(conversation);
                const lastMessage =
                  conversation.lastMessage;
                const sentByCurrentUser =
                  lastMessage?.sender_id ===
                  currentUserId;

                return (
                  <button
                    key={
                      conversation.conversationId
                    }
                    type="button"
                    onClick={() =>
                      openConversation(
                        conversation.conversationId
                      )
                    }
                    className="flex w-full items-center gap-4 border-b border-pink-50 p-5 text-left transition last:border-b-0 hover:bg-pink-50/60"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-pink-100">
                      {conversation.otherUser
                        .avatar_url ? (
                        <Image
                          src={
                            conversation
                              .otherUser
                              .avatar_url
                          }
                          alt={`${displayName}'s avatar`}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-pink-500">
                          {getInitials(
                            displayName
                          ) || "P"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate font-bold text-gray-900">
                          {displayName}
                        </h2>

                        {conversation.unreadCount >
                        0 ? (
                          <span className="flex min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 py-0.5 text-xs font-bold text-white">
                            {conversation.unreadCount >
                            99
                              ? "99+"
                              : conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>

                      {username ? (
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {username}
                        </p>
                      ) : null}

                      <p
                        className={`mt-1 truncate text-sm ${
                          conversation.unreadCount >
                          0
                            ? "font-semibold text-gray-800"
                            : "text-gray-500"
                        }`}
                      >
                        {lastMessage
                          ? `${
                              sentByCurrentUser
                                ? "You: "
                                : ""
                            }${lastMessage.content}`
                          : "Start the conversation"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-xs text-gray-400">
                        {formatConversationTime(
                          lastMessage?.created_at ??
                            conversation.updatedAt
                        )}
                      </span>

                      <ArrowRight
                        size={17}
                        className="text-pink-300"
                      />
                    </div>
                  </button>
                );
              }
            )}
          </section>
        )}
      </div>
    </main>
  );
}