import { supabase } from "@/lib/supabase";

import type {
  ConversationMemberRow,
  ConversationPreview,
  ConversationMessage,
  ConversationRow,
  MessageProfile,
} from "@/lib/types/messages";

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function findDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string | null> {
  const {
    data: currentMemberships,
    error: currentError,
  } = await supabase
    .from("conversation_members")
    .select(
      "conversation_id, user_id, joined_at"
    )
    .eq("user_id", currentUserId);

  if (currentError) {
    throw new Error(currentError.message);
  }

  const conversationIds =
    (currentMemberships ?? []).map(
      (member) => member.conversation_id
    );

  if (conversationIds.length === 0) {
    return null;
  }

  const {
    data: otherMemberships,
    error: otherError,
  } = await supabase
    .from("conversation_members")
    .select(
      "conversation_id, user_id, joined_at"
    )
    .eq("user_id", otherUserId)
    .in(
      "conversation_id",
      conversationIds
    );

  if (otherError) {
    throw new Error(otherError.message);
  }

  const matchingIds =
    (otherMemberships ?? []).map(
      (member) => member.conversation_id
    );

  if (matchingIds.length === 0) {
    return null;
  }

  const {
    data: allMembers,
    error: membersError,
  } = await supabase
    .from("conversation_members")
    .select(
      "conversation_id, user_id, joined_at"
    )
    .in("conversation_id", matchingIds);

  if (membersError) {
    throw new Error(
      membersError.message
    );
  }

  const counts = new Map<
    string,
    number
  >();

  for (const member of allMembers ?? []) {
    counts.set(
      member.conversation_id,
      (counts.get(
        member.conversation_id
      ) ?? 0) + 1
    );
  }

  for (const id of matchingIds) {
    if (counts.get(id) === 2) {
      return id;
    }
  }

  return null;
}

export async function createDirectConversation(
  _currentUserId: string,
  otherUserId: string
): Promise<string> {
  const { data, error } =
    await supabase.rpc(
      "create_direct_conversation",
      {
        other_user_id: otherUserId,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  if (
    typeof data !== "string" ||
    !data
  ) {
    throw new Error(
      "Could not create conversation."
    );
  }

  return data;
}

export async function getConversationPreviews(
  currentUserId: string
): Promise<ConversationPreview[]> {
  try {
    const {
      data: memberships,
      error: membershipError,
    } = await supabase
      .from("conversation_members")
      .select(
        "conversation_id, user_id, joined_at"
      )
      .eq("user_id", currentUserId);

    if (membershipError) {
      throw new Error(
        membershipError.message
      );
    }

    const conversationIds =
      (memberships ?? []).map(
        (member) =>
          member.conversation_id
      );

    if (conversationIds.length === 0) {
      return [];
    }

    const {
      data: conversations,
      error: conversationError,
    } = await supabase
      .from("conversations")
      .select(
        "id, created_at, updated_at"
      )
      .in("id", conversationIds)
      .order("updated_at", {
        ascending: false,
      });

    if (conversationError) {
      throw new Error(
        conversationError.message
      );
    }

    const {
      data: memberRows,
      error: memberRowsError,
    } = await supabase
      .from("conversation_members")
      .select(
        "conversation_id, user_id, joined_at"
      )
      .in(
        "conversation_id",
        conversationIds
      );

    if (memberRowsError) {
      throw new Error(
        memberRowsError.message
      );
    }

    const members =
      (memberRows ??
        []) as ConversationMemberRow[];

    const otherUserIds = Array.from(
      new Set(
        members
          .filter(
            (member) =>
              member.user_id !==
              currentUserId
          )
          .map(
            (member) =>
              member.user_id
          )
      )
    );

    let profiles: MessageProfile[] = [];

    if (otherUserIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url"
        )
        .in("id", otherUserIds);

      if (error) {
        throw new Error(error.message);
      }

      profiles =
        (data ??
          []) as MessageProfile[];
    }

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const previews = await Promise.all(
      (
        conversations as ConversationRow[]
      ).map(
        async (conversation) => {
          const otherMember =
            members.find(
              (member) =>
                member.conversation_id ===
                  conversation.id &&
                member.user_id !==
                  currentUserId
            );

          if (!otherMember) {
            return null;
          }

          const otherUser =
            profileMap.get(
              otherMember.user_id
            );

          if (!otherUser) {
            return null;
          }

          const {
            data: lastMessages,
            error:
              lastMessageError,
          } = await supabase
            .from("messages")
            .select(
              "id, conversation_id, sender_id, content, created_at, read_at, reply_to_message_id"
            )
            .eq(
              "conversation_id",
              conversation.id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(1);

          if (
            lastMessageError
          ) {
            throw new Error(
              lastMessageError.message
            );
          }

          const {
            count,
            error:
              unreadError,
          } = await supabase
            .from("messages")
            .select("id", {
              head: true,
              count: "exact",
            })
            .eq(
              "conversation_id",
              conversation.id
            )
            .neq(
              "sender_id",
              currentUserId
            )
            .is(
              "read_at",
              null
            );

          if (unreadError) {
            throw new Error(
              unreadError.message
            );
          }

          return {
            conversationId:
              conversation.id,
            otherUser,
            lastMessage:
              (lastMessages?.[0] ??
                null) as ConversationMessage | null,
            unreadCount:
              count ?? 0,
            updatedAt:
              conversation.updated_at,
          };
        }
      )
    );

    return previews.filter(
      (
        preview
      ): preview is ConversationPreview =>
        preview !== null
    );
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Could not load conversations."
      )
    );
  }
}