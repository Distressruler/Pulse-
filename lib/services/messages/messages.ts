import { supabase } from "@/lib/supabase";

import type {
  ConversationMessage,
} from "@/lib/types/messages";

const MESSAGE_FIELDS = `
id,
conversation_id,
sender_id,
message_type,
content,
audio_url,
audio_duration,
image_url,
created_at,
read_at,
reply_to_message_id
`;

async function touchConversation(
  conversationId: string
) {
  const { error } = await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    console.error(
      "Could not update conversation timestamp:",
      error.message
    );
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_FIELDS)
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ConversationMessage[];
}

export async function sendConversationMessage(
  conversationId: string,
  senderId: string,
  content: string,
  replyToMessageId: string | null = null
): Promise<ConversationMessage> {
  const cleaned = content.trim();

  if (!cleaned) {
    throw new Error("Please enter a message.");
  }

  if (cleaned.length > 2000) {
    throw new Error(
      "Messages cannot be longer than 2,000 characters."
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: "text",
      content: cleaned,
      reply_to_message_id: replyToMessageId,
    })
    .select(MESSAGE_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await touchConversation(conversationId);

  return data as ConversationMessage;
}

export async function sendVoiceMessage(
  conversationId: string,
  senderId: string,
  audioUrl: string,
  duration: number,
  replyToMessageId: string | null = null
): Promise<ConversationMessage> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: "voice",
      content: null,
      audio_url: audioUrl,
      audio_duration: duration,
      reply_to_message_id: replyToMessageId,
    })
    .select(MESSAGE_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await touchConversation(conversationId);

  return data as ConversationMessage;
}

export async function sendImageMessage(
  conversationId: string,
  senderId: string,
  imageUrl: string,
  replyToMessageId: string | null = null
): Promise<ConversationMessage> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message_type: "image",
      content:null, 
      image_url: imageUrl,
      reply_to_message_id: replyToMessageId,
    })
    .select(MESSAGE_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await touchConversation(conversationId);

  return data as ConversationMessage;
}

export async function markConversationAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .neq("sender_id", currentUserId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}

export async function unsendConversationMessage(
  messageId: string
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    throw new Error(error.message);
  }
}