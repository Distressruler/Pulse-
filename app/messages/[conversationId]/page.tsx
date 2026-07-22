"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Mic,
  Reply,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";

import type {
  ConversationMessage,
  MessageProfile,
} from "@/lib/types/messages";
import {
  getConversationMessages,
  markConversationAsRead,
  sendConversationMessage,
  sendImageMessage,
  sendVoiceMessage,
  unsendConversationMessage,
} from "@/lib/services/messages/messages";
import {
  uploadMessageImage,
  uploadVoiceMessage,
} from "@/lib/services/messages/uploads";
import { supabase } from "@/lib/supabase";

function ChatSkeleton() {
  return (
    <div className="h-full rounded-none border-0 bg-white p-5 shadow-none sm:rounded-3xl sm:border sm:border-pink-100 sm:shadow-sm">
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

function getDisplayName(profile: MessageProfile | null) {
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
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMessageDate(value: string) {
  const date = new Date(value);
  const now = new Date();

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return "Today";
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date);
}

function shouldShowDateDivider(messages: ConversationMessage[], index: number) {
  if (index === 0) return true;

  const current = new Date(messages[index].created_at);
  const previous = new Date(messages[index - 1].created_at);

  return (
    current.getFullYear() !== previous.getFullYear() ||
    current.getMonth() !== previous.getMonth() ||
    current.getDate() !== previous.getDate()
  );
}

function getReplyAuthorName(
  message: ConversationMessage,
  currentUserId: string,
  otherUser: MessageProfile | null
) {
  return message.sender_id === currentUserId ? "You" : getDisplayName(otherUser);
}

function getMessagePreview(message: ConversationMessage) {
  if (message.message_type === "image") return "Photo";
  if (message.message_type === "voice") return "Voice message";
  const content = (message.content ?? "").trim();
  return content.length <= 100 ? content : `${content.slice(0, 100)}…`;
}

function formatDuration(seconds: number | null | undefined) {
  const safeSeconds = Math.max(0, Math.round(seconds ?? 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams<{ conversationId: string }>();
  const conversationId =
    typeof params.conversationId === "string" ? params.conversationId : "";

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentUserId, setCurrentUserId] = useState("");
  const [otherUser, setOtherUser] = useState<MessageProfile | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingToMessage, setReplyingToMessage] =
    useState<ConversationMessage | null>(null);
  const [selectedMessage, setSelectedMessage] =
    useState<ConversationMessage | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [sendError, setSendError] = useState("");

  const busy = sending || uploadingImage || uploadingVoice;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [messageText]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const appendMessage = useCallback((message: ConversationMessage) => {
    setMessages((current) =>
      current.some((item) => item.id === message.id)
        ? current
        : [...current, message]
    );
  }, []);

  const stopMediaTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const loadOtherUser = useCallback(
    async (userId: string) => {
      const { data: members, error: membersError } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", conversationId);

      if (membersError) throw new Error(membersError.message);

      const otherMember = members?.find((member) => member.user_id !== userId);
      if (!otherMember) {
        throw new Error("The other conversation member could not be found.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", otherMember.user_id)
        .single();

      if (profileError) throw new Error(profileError.message);
      setOtherUser(profile as MessageProfile);
    },
    [conversationId]
  );

  const loadConversation = useCallback(
    async (userId: string) => {
      setErrorMessage("");

      try {
        await loadOtherUser(userId);
        const loadedMessages = await getConversationMessages(conversationId);
        setMessages(loadedMessages);

        await markConversationAsRead(conversationId, userId);
        setMessages((current) =>
          current.map((message) =>
            message.sender_id !== userId && !message.read_at
              ? { ...message, read_at: new Date().toISOString() }
              : message
          )
        );

        requestAnimationFrame(() => scrollToBottom("auto"));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load this conversation."
        );
      } finally {
        setPageLoading(false);
      }
    },
    [conversationId, loadOtherUser, scrollToBottom]
  );

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!conversationId) {
        setErrorMessage("This conversation link is invalid.");
        setPageLoading(false);
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !user) {
        router.push("/login");
        router.refresh();
        return;
      }

      setCurrentUserId(user.id);
      await loadConversation(user.id);
    }

    void loadPage();
    return () => {
      mounted = false;
    };
  }, [conversationId, loadConversation, router]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as ConversationMessage;
          appendMessage(newMessage);

          if (newMessage.sender_id !== currentUserId) {
            try {
              await markConversationAsRead(conversationId, currentUserId);
              setMessages((current) =>
                current.map((message) =>
                  message.id === newMessage.id
                    ? { ...message, read_at: new Date().toISOString() }
                    : message
                )
              );
            } catch {
              // Message remains visible even if marking it read fails.
            }
          }

          requestAnimationFrame(() => scrollToBottom());
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
          const updated = payload.new as ConversationMessage;
          setMessages((current) =>
            current.map((message) => (message.id === updated.id ? updated : message))
          );
          setReplyingToMessage((reply) => (reply?.id === updated.id ? updated : reply));
          setSelectedMessage((selected) =>
            selected?.id === updated.id ? updated : selected
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
          const deleted = payload.old as Pick<ConversationMessage, "id">;
          setMessages((current) => current.filter((message) => message.id !== deleted.id));
          setReplyingToMessage((reply) => (reply?.id === deleted.id ? null : reply));
          setSelectedMessage((selected) =>
            selected?.id === deleted.id ? null : selected
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [appendMessage, conversationId, currentUserId, scrollToBottom]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopMediaTracks();
    };
  }, [clearRecordingTimer, stopMediaTracks]);

  function handleStartReply(message: ConversationMessage) {
    setReplyingToMessage(message);
    setSendError("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleCancelReply() {
    setReplyingToMessage(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = messageText.trim();

    if (!cleaned || busy || recording || !currentUserId) return;

    setSending(true);
    setSendError("");

    try {
      const sent = await sendConversationMessage(
        conversationId,
        currentUserId,
        cleaned,
        replyingToMessage?.id ?? null
      );

      appendMessage(sent);
      setMessageText("");
      setReplyingToMessage(null);
      requestAnimationFrame(() => {
        scrollToBottom();
        textareaRef.current?.focus();
      });
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || busy || recording || !currentUserId) return;
    if (!file.type.startsWith("image/")) {
      setSendError("Please select an image file.");
      return;
    }

    setUploadingImage(true);
    setSendError("");

try {
  const imageUrl = await uploadMessageImage(
    conversationId,
    file
  );

  const sent = await sendImageMessage(
    conversationId,
    currentUserId,
    imageUrl,
    replyingToMessage?.id ?? null
  );

  appendMessage(sent);
  setReplyingToMessage(null);
  requestAnimationFrame(() => scrollToBottom());
} catch (error) {
  setSendError(
    error instanceof Error
      ? error.message
      : "The image could not be sent."
  );
} finally {
  setUploadingImage(false);
}
}

async function startRecording() {
    if (busy || recording || !currentUserId) return;

    setSendError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Voice recording is not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);

      recordingChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setSendError("Voice recording failed. Please try again.");
      };

      recorder.onstop = async () => {
        clearRecordingTimer();
        setRecording(false);

        const startedAt = recordingStartedAtRef.current;
        const duration = startedAt
          ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
          : Math.max(1, recordingSeconds);

        recordingStartedAtRef.current = null;
        stopMediaTracks();

        if (recordingChunksRef.current.length === 0) return;

        setUploadingVoice(true);

        try {
          const mimeType = recorder.mimeType || "audio/webm";
          const blob = new Blob(recordingChunksRef.current, { type: mimeType });
          const extension = mimeType.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `voice-${Date.now()}.${extension}`, {
            type: mimeType,
          });

        const audioUrl = await uploadVoiceMessage(
  conversationId,
  file
);

const sent = await sendVoiceMessage(
  conversationId,
  currentUserId,
  audioUrl,
  duration,
  replyingToMessage?.id ?? null
);

          appendMessage(sent);
          setReplyingToMessage(null);
          requestAnimationFrame(() => scrollToBottom());
        } catch (error) {
          setSendError(
            error instanceof Error ? error.message : "The voice message could not be sent."
          );
        } finally {
          recordingChunksRef.current = [];
          setRecordingSeconds(0);
          setUploadingVoice(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);

      recordingTimerRef.current = setInterval(() => {
        const startedAt = recordingStartedAtRef.current;
        if (startedAt) {
          setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }
      }, 250);
    } catch (error) {
      stopMediaTracks();
      setRecording(false);
      setSendError(
        error instanceof Error ? error.message : "Microphone access could not be started."
      );
    }
  }

  function stopRecording() {
    clearRecordingTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function cancelRecording() {
    clearRecordingTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    recordingChunksRef.current = [];
    recordingStartedAtRef.current = null;
    setRecording(false);
    setRecordingSeconds(0);
    stopMediaTracks();
  }

  async function handleUnsendMessage(messageId: string) {
    if (deletingMessageId) return;

    setDeletingMessageId(messageId);
    setSendError("");

    try {
      await unsendConversationMessage(messageId);
      setMessages((current) => current.filter((message) => message.id !== messageId));
      setReplyingToMessage((reply) => (reply?.id === messageId ? null : reply));
      setSelectedMessage(null);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Could not unsend the message.");
    } finally {
      setDeletingMessageId(null);
    }
  }

  const displayName = getDisplayName(otherUser);
  const latestOwnMessage = [...messages]
    .reverse()
    .find((message) => message.sender_id === currentUserId);
  const messageMap = new Map(messages.map((message) => [message.id, message]));

  return (
    <main className="h-[calc(100dvh-7rem)] overflow-hidden bg-gradient-to-b from-pink-50 via-white to-rose-50 text-gray-900 sm:px-6 sm:py-6">
      <div className="mx-auto h-full max-w-2xl">
        {pageLoading ? (
          <ChatSkeleton />
        ) : errorMessage ? (
          <section className="flex h-full flex-col items-center justify-center rounded-none bg-white p-8 text-center sm:rounded-3xl sm:border sm:border-red-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={27} />
            </div>
            <h1 className="mt-4 text-xl font-bold">Conversation unavailable</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">{errorMessage}</p>
            <Link
              href="/messages"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600"
            >
              <ArrowLeft size={17} />
              Back to messages
            </Link>
          </section>
        ) : (
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-none bg-white sm:rounded-3xl sm:border sm:border-pink-100 sm:shadow-sm">
            <header className="flex items-center gap-3 border-b border-pink-100 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => router.push("/messages")}
                aria-label="Back to messages"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-pink-50 hover:text-pink-500"
              >
                <ArrowLeft size={21} />
              </button>

              <Link
                href={otherUser ? `/profile/${otherUser.id}` : "/messages"}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-pink-100">
                  {otherUser?.avatar_url ? (
                    <Image
                      src={otherUser.avatar_url}
                      alt={`${displayName}'s avatar`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-pink-500">
                      {getInitials(displayName) || "P"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate font-bold">{displayName}</h1>
                  <p className="truncate text-xs text-gray-400">
                    {otherUser?.username ? `@${otherUser.username}` : "Pulse conversation"}
                  </p>
                </div>
              </Link>
            </header>

            <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto bg-gradient-to-b from-white to-pink-50/40 px-4 py-6 sm:px-6">
              {messages.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                    <MessageCircle size={30} />
                  </div>
                  <h2 className="mt-4 text-lg font-bold">Start your conversation</h2>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    Send a message to {displayName} to begin chatting.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    const sentByCurrentUser = message.sender_id === currentUserId;
                    const isLatestOwnMessage = latestOwnMessage?.id === message.id;
                    const repliedMessage = message.reply_to_message_id
                      ? messageMap.get(message.reply_to_message_id) ?? null
                      : null;

                    return (
                      <div key={message.id}>
                        {shouldShowDateDivider(messages, index) ? (
                          <div className="my-5 flex items-center gap-3">
                            <div className="h-px flex-1 bg-pink-100" />
                            <span className="text-xs font-medium text-gray-400">
                              {formatMessageDate(message.created_at)}
                            </span>
                            <div className="h-px flex-1 bg-pink-100" />
                          </div>
                        ) : null}

                        <div
                          className={`relative flex overflow-hidden ${
                            sentByCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div className="pointer-events-none absolute inset-y-0 left-1 flex items-center text-pink-400">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100">
                              <Reply size={17} />
                            </div>
                          </div>

                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 84 }}
                            dragElastic={0.12}
                            onDragEnd={(_, info) => {
                              if (info.offset.x >= 55) handleStartReply(message);
                            }}
                            whileTap={{ scale: 0.985 }}
                            className={`flex max-w-[82%] touch-pan-y flex-col sm:max-w-[72%] ${
                              sentByCurrentUser ? "items-end" : "items-start"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (sentByCurrentUser) setSelectedMessage(message);
                              }}
                              className={`w-full text-left ${
                                sentByCurrentUser ? "cursor-pointer" : "cursor-default"
                              }`}
                              aria-label={sentByCurrentUser ? "Open message actions" : undefined}
                            >
                              <div
                                className={`overflow-hidden rounded-[24px] text-sm leading-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.02] ${
                                  sentByCurrentUser
                                    ? "rounded-br-[7px] bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 text-white"
                                    : "rounded-bl-[7px] border border-gray-100/80 bg-white/95 text-gray-800"
                                }`}
                              >
                                <div className="px-4 pt-3">
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
                                              sentByCurrentUser ? "text-white" : "text-pink-600"
                                            }`}
                                          >
                                            {getReplyAuthorName(
                                              repliedMessage,
                                              currentUserId,
                                              otherUser
                                            )}
                                          </p>
                                          <p
                                            className={`mt-0.5 line-clamp-2 text-xs leading-5 ${
                                              sentByCurrentUser
                                                ? "text-white/80"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            {getMessagePreview(repliedMessage)}
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
                                          Original message unavailable
                                        </p>
                                      )}
                                    </div>
                                  ) : null}
                                </div>

                                {message.message_type === "image" && message.image_url ? (
                                  <div className="relative mx-2 mb-2 aspect-[4/5] min-w-[220px] overflow-hidden rounded-[18px] bg-black/5">
                                    <Image
                                      src={message.image_url}
                                      alt="Shared image"
                                      fill
                                      sizes="(max-width: 640px) 70vw, 420px"
                                      className="object-cover"
                                    />
                                  </div>
                                ) : message.message_type === "voice" && message.audio_url ? (
                                  <div className="min-w-[240px] px-4 pb-3">
                                    <audio
                                      controls
                                      preload="metadata"
                                      src={message.audio_url}
                                      className="h-10 w-full max-w-[280px]"
                                    />
                                    <p
                                      className={`mt-1 text-[11px] ${
                                        sentByCurrentUser ? "text-white/75" : "text-gray-400"
                                      }`}
                                    >
                                      {formatDuration(message.audio_duration)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words px-4 pb-3">
                                    {message.content}
                                  </p>
                                )}
                              </div>
                            </button>

                            <div
                              className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-gray-400 ${
                                sentByCurrentUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span>{formatMessageTime(message.created_at)}</span>
                              {sentByCurrentUser ? (
                                message.read_at ? (
                                  <CheckCheck size={14} className="text-pink-500" />
                                ) : (
                                  <Check size={14} />
                                )
                              ) : null}
                            </div>

                            {sentByCurrentUser && isLatestOwnMessage && message.read_at ? (
                              <p className="mt-0.5 px-1 text-right text-[10px] font-medium text-pink-400">
                                Seen
                              </p>
                            ) : null}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-pink-100/80 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-5 sm:pb-5 sm:pt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelected}
              />

              <AnimatePresence initial={false}>
                {replyingToMessage ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: 8, height: 0 }}
                    className="mb-3 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 rounded-[20px] border border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50/70 px-4 py-3 shadow-sm">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-pink-500 shadow-sm">
                        <Reply size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-pink-600">
                          Replying to {getReplyAuthorName(replyingToMessage, currentUserId, otherUser)}
                        </p>
                        <p className="mt-1 truncate text-sm text-gray-500">
                          {getMessagePreview(replyingToMessage)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelReply}
                        aria-label="Cancel reply"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-pink-500"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {sendError ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mb-3 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    <AlertCircle size={17} className="shrink-0" />
                    <p>{sendError}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {recording ? (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={cancelRecording}
                    aria-label="Cancel recording"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex min-h-12 flex-1 items-center gap-3 rounded-[26px] border border-red-100 bg-red-50 px-4">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                    <span className="text-sm font-semibold text-red-600">Recording</span>
                    <span className="ml-auto font-mono text-sm text-red-500">
                      {formatDuration(recordingSeconds)}
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    onClick={stopRecording}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Stop and send recording"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200/70"
                  >
                    <Square size={17} fill="currentColor" />
                  </motion.button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                    aria-label="Send image"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-pink-500 transition hover:bg-pink-50 disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <LoaderCircle size={20} className="animate-spin" />
                    ) : (
                      <ImagePlus size={21} />
                    )}
                  </button>

                  <div className="flex min-h-12 flex-1 items-end rounded-[26px] border border-pink-100 bg-pink-50/70 px-4 py-2 shadow-inner shadow-pink-100/30 focus-within:border-pink-300 focus-within:bg-white">
                    <textarea
                      ref={textareaRef}
                      value={messageText}
                      onChange={(event) => {
                        setMessageText(event.target.value);
                        setSendError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape" && replyingToMessage) {
                          event.preventDefault();
                          handleCancelReply();
                          return;
                        }
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder={
                        replyingToMessage ? "Write a reply..." : `Message ${displayName}`
                      }
                      maxLength={2000}
                      rows={1}
                      disabled={busy}
                      className="max-h-32 min-h-8 w-full resize-none overflow-y-auto bg-transparent py-1 text-[15px] leading-6 outline-none placeholder:text-gray-400 disabled:opacity-60"
                    />
                  </div>

                  {messageText.trim() ? (
                    <motion.button
                      type="submit"
                      disabled={busy}
                      aria-label="Send message"
                      whileTap={{ scale: 0.9 }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200/70 disabled:opacity-50"
                    >
                      {sending ? (
                        <LoaderCircle size={20} className="animate-spin" />
                      ) : (
                        <Send size={19} className="translate-x-[1px]" />
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={startRecording}
                      disabled={busy}
                      aria-label="Record voice message"
                      whileTap={{ scale: 0.9 }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200/70 disabled:opacity-50"
                    >
                      {uploadingVoice ? (
                        <LoaderCircle size={20} className="animate-spin" />
                      ) : (
                        <Mic size={20} />
                      )}
                    </motion.button>
                  )}
                </form>
              )}
            </footer>
          </section>
        )}
      </div>

      <AnimatePresence>
        {selectedMessage ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 px-4 pb-4 backdrop-blur-[2px] sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div
              initial={{ y: 36, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-[28px] border border-pink-100 bg-white p-3 shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-gray-200 sm:hidden" />
              <div className="rounded-2xl bg-pink-50 px-4 py-3">
                <p className="line-clamp-3 break-words text-sm leading-6 text-gray-600">
                  {getMessagePreview(selectedMessage)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleUnsendMessage(selectedMessage.id)}
                disabled={deletingMessageId === selectedMessage.id}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingMessageId === selectedMessage.id ? (
                  <LoaderCircle size={20} className="animate-spin" />
                ) : (
                  <Trash2 size={20} />
                )}
                {deletingMessageId === selectedMessage.id
                  ? "Unsending..."
                  : "Unsend message"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="mt-1 w-full rounded-2xl px-4 py-3.5 text-center font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
