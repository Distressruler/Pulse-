import { supabase } from "@/lib/supabase";

import type {
  ConversationMessage,
} from "@/lib/types/messages";

const MESSAGE_FIELDS =
  "id, conversation_id, sender_id, content, created_at, read_at, reply_to_message_id";

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
  const cleanedContent = content.trim();

  if (!cleanedContent) {
    throw new Error("Please enter a message.");
  }

  if (cleanedContent.length > 2000) {
    throw new Error(
      "Messages cannot be longer than 2,000 characters."
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: cleanedContent,
      reply_to_message_id:
        replyToMessageId,
    })
    .select(MESSAGE_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: updateError } = await supabase
    .from("conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (updateError) {
    console.error(
      "Could not update conversation timestamp:",
      updateError.message
    );
  }

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