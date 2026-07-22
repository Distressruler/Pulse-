export type MessageType = "text" | "voice" | "image";

export type MessageProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;

  message_type: MessageType;

  content: string | null;

  audio_url: string | null;
  audio_duration: number | null;

  image_url: string | null;

  created_at: string;
  read_at: string | null;

  reply_to_message_id: string | null;
};