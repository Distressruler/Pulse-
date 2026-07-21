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
  content: string;
  created_at: string;
  read_at: string | null;
  reply_to_message_id: string | null;
};

export type ConversationPreview = {
  conversationId: string;
  otherUser: MessageProfile;
  lastMessage: ConversationMessage | null;
  unreadCount: number;
  updatedAt: string;
};

export type ConversationMemberRow = {
  conversation_id: string;
  user_id: string;
  joined_at: string;
};

export type ConversationRow = {
  id: string;
  created_at: string;
  updated_at: string;
};