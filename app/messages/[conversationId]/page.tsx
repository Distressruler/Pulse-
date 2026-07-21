"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  Reply,
  Send,
  X,
} from "lucide-react";

import AppNav from "@/components/navigation/AppNav";
import type {
  ConversationMessage,
  MessageProfile,
} from "@/lib/types/messages";
import {
  getConversationMessages,
  markConversationAsRead,
  sendConversationMessage,
  unsendConversationMessage,
} from "@/lib/services/messages/messages";
import { supabase } from "@/lib/supabase";

function ChatSkeleton() {
  return (
    <div className="mt-6 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 border-b border-pink-50 pb-5">
          <div className="h-12 w-12 rounded-full bg-pink-100" />

          <div>
            <div className="h-4 w-32 rounded-full bg-pink-100" />
            <div className="mt-2 h-3 w-20 rounded-full bg-pink-50" />
          </div>
        </div>

        <div className="space-y-5 py-8">
          <div className="h-14 w-3/5 rounded-2xl rounded-bl-md bg-gray-100" />

          <div className="ml-auto h-16 w-2/3 rounded-2xl rounded-br-md bg-pink-100" />

          <div className="h-12 w-1/2 rounded-2xl rounded-bl-md bg-gray-100" />

          <div className="ml-auto h-14 w-3/5 rounded-2xl rounded-br-md bg-pink-100" />
        </div>

        <div className="flex gap-3 border-t border-pink-50 pt-5">
          <div className="h-12 flex-1 rounded-full bg-pink-50" />
          <div className="h-12 w-12 rounded-full bg-pink-100" />
        </div>
      </div>
    </div>
  );
}

function getDisplayName(
  profile: MessageProfile | null
) {
  return (
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    "Pulse user"
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part[0]?.toUpperCase()
    )
    .join("");
}

function formatMessageTime(
  dateValue: string
) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(new Date(dateValue));
}

function formatMessageDate(
  dateValue: string
) {
  const date = new Date(dateValue);
  const now = new Date();

  const isToday =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(
    now.getDate() - 1
  );

  const isYesterday =
    date.getFullYear() ===
      yesterday.getFullYear() &&
    date.getMonth() ===
      yesterday.getMonth() &&
    date.getDate() ===
      yesterday.getDate();

  if (isYesterday) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "long",
      day: "numeric",
      year:
        date.getFullYear() ===
        now.getFullYear()
          ? undefined
          : "numeric",
    }
  ).format(date);
}

function shouldShowDateDivider(
  messages: ConversationMessage[],
  index: number
) {
  if (index === 0) {
    return true;
  }

  const currentDate = new Date(
    messages[index].created_at
  );

  const previousDate = new Date(
    messages[index - 1].created_at
  );

  return (
    currentDate.getFullYear() !==
      previousDate.getFullYear() ||
    currentDate.getMonth() !==
      previousDate.getMonth() ||
    currentDate.getDate() !==
      previousDate.getDate()
  );
}

function getReplyAuthorName(
  message: ConversationMessage,
  currentUserId: string,
  otherUser: MessageProfile | null
) {
  if (
    message.sender_id === currentUserId
  ) {
    return "You";
  }

  return getDisplayName(otherUser);
}

function getReplyPreviewContent(
  content: string
) {
  const cleanedContent =
    content.trim();

  if (cleanedContent.length <= 100) {
    return cleanedContent;
  }

  return `${cleanedContent.slice(
    0,
    100
  )}…`;
}

export default function ConversationPage() {
  const router = useRouter();

  const params = useParams<{
    conversationId: string;
  }>();

  const conversationId =
    typeof params.conversationId ===
    "string"
      ? params.conversationId
      : "";

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [
    deletingMessageId,
    setDeletingMessageId,
  ] = useState<string | null>(null);
  const [otherUser, setOtherUser] =
    useState<MessageProfile | null>(
      null
    );

  const [messages, setMessages] =
    useState<
      ConversationMessage[]
    >([]);

  const [messageText, setMessageText] =
    useState("");

  const [
    replyingToMessage,
    setReplyingToMessage,
  ] =
    useState<ConversationMessage | null>(
      null
    );

  const [pageLoading, setPageLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [sendError, setSendError] =
    useState("");

  const scrollToBottom = useCallback(
    (
      behavior: ScrollBehavior = "smooth"
    ) => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior,
        }
      );
    },
    []
  );

  const loadOtherUser = useCallback(
    async (userId: string) => {
      const {
        data: members,
        error: membersError,
      } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq(
          "conversation_id",
          conversationId
        );

      if (membersError) {
        throw new Error(
          membersError.message
        );
      }

      const otherMember =
        members?.find(
          (member) =>
            member.user_id !== userId
        );

      if (!otherMember) {
        throw new Error(
          "The other conversation member could not be found."
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url"
        )
        .eq(
          "id",
          otherMember.user_id
        )
        .single();

      if (profileError) {
        throw new Error(
          profileError.message
        );
      }

      setOtherUser(
        profile as MessageProfile
      );
    },
    [conversationId]
  );

  const loadConversation = useCallback(
    async (userId: string) => {
      setErrorMessage("");

      try {
        await loadOtherUser(userId);

        const loadedMessages =
          await getConversationMessages(
            conversationId
          );

        setMessages(loadedMessages);

        await markConversationAsRead(
          conversationId,
          userId
        );

        setMessages(
          (currentMessages) =>
            currentMessages.map(
              (message) => {
                if (
                  message.sender_id !==
                    userId &&
                  !message.read_at
                ) {
                  return {
                    ...message,
                    read_at:
                      new Date().toISOString(),
                  };
                }

                return message;
              }
            )
        );

        requestAnimationFrame(() => {
          scrollToBottom("auto");
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load this conversation."
        );
      } finally {
        setPageLoading(false);
      }
    },
    [
      conversationId,
      loadOtherUser,
      scrollToBottom,
    ]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      if (!conversationId) {
        setErrorMessage(
          "This conversation link is invalid."
        );

        setPageLoading(false);
        return;
      }

      const {
        data: { user },
        error,
      } =
        await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (error || !user) {
        router.push("/login");
        router.refresh();
        return;
      }

      setCurrentUserId(user.id);

      await loadConversation(
        user.id
      );
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [
    conversationId,
    loadConversation,
    router,
  ]);

  useEffect(() => {
    if (
      !conversationId ||
      !currentUserId
    ) {
      return;
    }

    const channel = supabase
      .channel(
        `conversation-${conversationId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage =
            payload.new as ConversationMessage;

          setMessages(
            (currentMessages) => {
              const alreadyExists =
                currentMessages.some(
                  (message) =>
                    message.id ===
                    newMessage.id
                );

              if (alreadyExists) {
                return currentMessages;
              }

              return [
                ...currentMessages,
                newMessage,
              ];
            }
          );

          if (
            newMessage.sender_id !==
            currentUserId
          ) {
            try {
              await markConversationAsRead(
                conversationId,
                currentUserId
              );

              setMessages(
                (currentMessages) =>
                  currentMessages.map(
                    (message) =>
                      message.id ===
                      newMessage.id
                        ? {
                            ...message,
                            read_at:
                              new Date().toISOString(),
                          }
                        : message
                  )
              );
            } catch {
              // The message still appears if
              // updating its read status fails.
            }
          }

          requestAnimationFrame(() => {
            scrollToBottom();
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage =
            payload.new as ConversationMessage;

          setMessages(
            (currentMessages) =>
              currentMessages.map(
                (message) =>
                  message.id ===
                  updatedMessage.id
                    ? updatedMessage
                    : message
              )
          );

          setReplyingToMessage(
            (currentReply) =>
              currentReply?.id ===
              updatedMessage.id
                ? updatedMessage
                : currentReply
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedMessage =
            payload.old as Pick<
              ConversationMessage,
              "id"
            >;

          setMessages(
            (currentMessages) =>
              currentMessages.filter(
                (message) =>
                  message.id !==
                  deletedMessage.id
              )
          );

          setReplyingToMessage(
            (currentReply) =>
              currentReply?.id ===
              deletedMessage.id
                ? null
                : currentReply
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [
    conversationId,
    currentUserId,
    scrollToBottom,
  ]);

  function handleStartReply(
    message: ConversationMessage
  ) {
    setReplyingToMessage(message);
    setSendError("");

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  function handleCancelReply() {
    setReplyingToMessage(null);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanedMessage =
      messageText.trim();

    if (
      !cleanedMessage ||
      sending ||
      !currentUserId
    ) {
      return;
    }

    setSending(true);
    setSendError("");

    try {
      const sentMessage =
        await sendConversationMessage(
          conversationId,
          currentUserId,
          cleanedMessage,
          replyingToMessage?.id ?? null
        );

      setMessages(
        (currentMessages) => {
          const alreadyExists =
            currentMessages.some(
              (message) =>
                message.id ===
                sentMessage.id
            );

          if (alreadyExists) {
            return currentMessages;
          }

          return [
            ...currentMessages,
            sentMessage,
          ];
        }
      );

      setMessageText("");
      setReplyingToMessage(null);

      requestAnimationFrame(() => {
        scrollToBottom();
        textareaRef.current?.focus();
      });
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : "Your message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleUnsendMessage(
    messageId: string
  ) {
    if (deletingMessageId) {
      return;
    }

    try {
      setDeletingMessageId(messageId);
      setSendError("");

      await unsendConversationMessage(
        messageId
      );

      setMessages(
        (currentMessages) =>
          currentMessages.filter(
            (message) =>
              message.id !== messageId
          )
      );

      setReplyingToMessage(
        (currentReply) =>
          currentReply?.id === messageId
            ? null
            : currentReply
      );
    } catch (error) {
      console.error(
        "Could not unsend message:",
        error
      );

      setSendError(
        error instanceof Error
          ? error.message
          : "Could not unsend the message."
      );
    } finally {
      setDeletingMessageId(null);
    }
  }

  const displayName =
    getDisplayName(otherUser);

  const latestOwnMessage = [
    ...messages,
  ]
    .reverse()
    .find(
      (message) =>
        message.sender_id ===
        currentUserId
    );

  const messageMap = new Map(
    messages.map((message) => [
      message.id,
      message,
    ])
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {currentUserId ? (
          <AppNav
            currentUserId={
              currentUserId
            }
          />
        ) : null}

        {pageLoading ? (
          <ChatSkeleton />
        ) : errorMessage ? (
          <section className="mt-6 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle
                size={27}
              />
            </div>

            <h1 className="mt-4 text-xl font-bold text-gray-900">
              Conversation unavailable
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {errorMessage}
            </p>

            <Link
              href="/messages"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600"
            >
              <ArrowLeft
                size={17}
              />
              Back to messages
            </Link>
          </section>
        ) : (
          <section className="mt-6 flex min-h-[650px] flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
            <header className="flex items-center gap-3 border-b border-pink-100 p-4 sm:p-5">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/messages"
                  )
                }
                aria-label="Back to messages"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-pink-50 hover:text-pink-500"
              >
                <ArrowLeft
                  size={21}
                />
              </button>

              <Link
                href={
                  otherUser
                    ? `/profile/${otherUser.id}`
                    : "/messages"
                }
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-pink-100">
                  {otherUser?.avatar_url ? (
                    <Image
                      src={
                        otherUser.avatar_url
                      }
                      alt={`${displayName}'s avatar`}
                      fill
                      sizes="48px"
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

                <div className="min-w-0">
                  <h1 className="truncate font-bold text-gray-900">
                    {displayName}
                  </h1>

                  <p className="truncate text-xs text-gray-400">
                    {otherUser?.username
                      ? `@${otherUser.username}`
                      : "Pulse conversation"}
                  </p>
                </div>
              </Link>
            </header>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-pink-50/40 px-4 py-6 sm:px-6">
              {messages.length ===
              0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                    <MessageCircle
                      size={30}
                    />
                  </div>

                  <h2 className="mt-4 text-lg font-bold text-gray-900">
                    Start your
                    conversation
                  </h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    Send a message to{" "}
                    {displayName} to
                    begin chatting.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(
                    (
                      message,
                      index
                    ) => {
                      const sentByCurrentUser =
                        message.sender_id ===
                        currentUserId;

                      const isLatestOwnMessage =
                        latestOwnMessage?.id ===
                        message.id;

                      const repliedMessage =
                        message.reply_to_message_id
                          ? messageMap.get(
                              message.reply_to_message_id
                            ) ?? null
                          : null;

                      return (
                        <div
                          key={
                            message.id
                          }
                        >
                          {shouldShowDateDivider(
                            messages,
                            index
                          ) ? (
                            <div className="my-5 flex items-center gap-3">
                              <div className="h-px flex-1 bg-pink-100" />

                              <span className="text-xs font-medium text-gray-400">
                                {formatMessageDate(
                                  message.created_at
                                )}
                              </span>

                              <div className="h-px flex-1 bg-pink-100" />
                            </div>
                          ) : null}

                          <div
                            className={`group flex ${
                              sentByCurrentUser
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex max-w-[82%] flex-col sm:max-w-[72%] ${
                                sentByCurrentUser
                                  ? "items-end"
                                  : "items-start"
                              }`}
                            >
                              <div
                                className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                                  sentByCurrentUser
                                    ? "rounded-br-md bg-pink-500 text-white"
                                    : "rounded-bl-md border border-gray-100 bg-white text-gray-800"
                                }`}
                              >
                                {message.reply_to_message_id ? (
                                  <div
                                    className={`mb-2 rounded-xl border-l-4 px-3 py-2 ${
                                      sentByCurrentUser
                                        ? "border-white/70 bg-white/15"
                                        : "border-pink-400 bg-pink-50"
                                    }`}
                                  >
                                    {repliedMessage ? (
                                      <>
                                        <p
                                          className={`text-xs font-semibold ${
                                            sentByCurrentUser
                                              ? "text-white"
                                              : "text-pink-600"
                                          }`}
                                        >
                                          {getReplyAuthorName(
                                            repliedMessage,
                                            currentUserId,
                                            otherUser
                                          )}
                                        </p>

                                        <p
                                          className={`mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-5 ${
                                            sentByCurrentUser
                                              ? "text-white/80"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {getReplyPreviewContent(
                                            repliedMessage.content
                                          )}
                                        </p>
                                      </>
                                    ) : (
                                      <p
                                        className={`text-xs ${
                                          sentByCurrentUser
                                            ? "text-white/80"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        Original
                                        message
                                        unavailable
                                      </p>
                                    )}
                                  </div>
                                ) : null}

                                <p className="whitespace-pre-wrap break-words">
                                  {
                                    message.content
                                  }
                                </p>
                              </div>

                              <div
                                className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-gray-400 ${
                                  sentByCurrentUser
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <span>
                                  {formatMessageTime(
                                    message.created_at
                                  )}
                                </span>

                                {sentByCurrentUser ? (
                                  message.read_at ? (
                                    <CheckCheck
                                      size={
                                        14
                                      }
                                      className="text-pink-500"
                                    />
                                  ) : (
                                    <Check
                                      size={
                                        14
                                      }
                                    />
                                  )
                                ) : null}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleStartReply(
                                    message
                                  )
                                }
                                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-gray-400 opacity-100 transition hover:bg-pink-50 hover:text-pink-500 sm:opacity-0 sm:group-hover:opacity-100 ${
                                  sentByCurrentUser
                                    ? "self-end"
                                    : "self-start"
                                }`}
                                aria-label={`Reply to message: ${getReplyPreviewContent(
                                  message.content
                                )}`}
                              >
                                <Reply
                                  size={13}
                                />
                                Reply
                              </button>
                              {sentByCurrentUser ? (
  <button
    type="button"
    onClick={() =>
      handleUnsendMessage(message.id)
    }
    disabled={
      deletingMessageId === message.id
    }
    className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
  >
    {deletingMessageId === message.id
      ? "Unsending..."
      : "Unsend"}
  </button>
) : null}

                              {sentByCurrentUser &&
                              isLatestOwnMessage &&
                              message.read_at ? (
                                <p className="mt-0.5 px-1 text-right text-[10px] font-medium text-pink-400">
                                  Seen
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}

                  <div
                    ref={messagesEndRef}
                  />
                </div>
              )}
            </div>

            <footer className="border-t border-pink-100 bg-white p-4 sm:p-5">
              {replyingToMessage ? (
                <div className="mb-3 flex items-start gap-3 rounded-2xl border border-pink-100 bg-pink-50/70 px-4 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                    <Reply size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-pink-600">
                      Replying to{" "}
                      {getReplyAuthorName(
                        replyingToMessage,
                        currentUserId,
                        otherUser
                      )}
                    </p>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      {getReplyPreviewContent(
                        replyingToMessage.content
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCancelReply
                    }
                    aria-label="Cancel reply"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-white hover:text-pink-500"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : null}

              {sendError ? (
                <div className="mb-3 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle
                    size={17}
                    className="shrink-0"
                  />

                  <p>{sendError}</p>
                </div>
              ) : null}

              <form
                onSubmit={
                  handleSendMessage
                }
                className="flex items-end gap-3"
              >
                <div className="flex-1 rounded-3xl border border-pink-100 bg-pink-50/60 px-4 py-2 transition focus-within:border-pink-300 focus-within:bg-white">
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(
                      event
                    ) => {
                      setMessageText(
                        event.target.value
                      );

                      setSendError("");
                    }}
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Escape" &&
                        replyingToMessage
                      ) {
                        event.preventDefault();
                        handleCancelReply();
                        return;
                      }

                      if (
                        event.key ===
                          "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();

                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder={
                      replyingToMessage
                        ? "Write a reply..."
                        : `Message ${displayName}`
                    }
                    maxLength={2000}
                    rows={1}
                    className="max-h-32 min-h-8 w-full resize-none bg-transparent py-1 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400"
                  />

                  <div className="flex justify-end">
                    <span className="text-[10px] text-gray-300">
                      {
                        messageText.length
                      }
                      /2000
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !messageText.trim()
                  }
                  aria-label="Send message"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white shadow-sm transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-200"
                >
                  {sending ? (
                    <LoaderCircle
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </form>

              <p className="mt-2 px-2 text-xs text-gray-400">
                Press Enter to send,
                Shift + Enter for a new
                line, and Escape to cancel
                a reply.
              </p>
            </footer>
          </section>
        )}
      </div>
    </main>
  );
}