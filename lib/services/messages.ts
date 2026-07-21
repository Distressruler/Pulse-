import { supabase } from "@/lib/supabase";

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
};

export type ConversationPreview = {
  conversationId: string;
  otherUser: MessageProfile;
  lastMessage: ConversationMessage | null;
  unreadCount: number;
  updatedAt: string;
};

type ConversationMemberRow = {
  conversation_id: string;
  user_id: string;
  joined_at: string;
};

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function getConversationMessages(
  conversationId: string
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, content, created_at, read_at"
    )
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
  content: string
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
    })
    .select(
      "id, conversation_id, sender_id, content, created_at, read_at"
    )
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

export async function findDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string | null> {
  const {
    data: currentUserMemberships,
    error: currentMembershipError,
  } = await supabase
    .from("conversation_members")
    .select(
      "conversation_id, user_id, joined_at"
    )
    .eq("user_id", currentUserId);

  if (currentMembershipError) {
    throw new Error(
      currentMembershipError.message
    );
  }

  const currentConversationIds = (
    currentUserMemberships ?? []
  ).map(
    (membership) =>
      membership.conversation_id
  );

  if (currentConversationIds.length === 0) {
    return null;
  }

  const {
    data: otherUserMemberships,
    error: otherMembershipError,
  } = await supabase
    .from("conversation_members")
    .select(
      "conversation_id, user_id, joined_at"
    )
    .eq("user_id", otherUserId)
    .in(
      "conversation_id",
      currentConversationIds
    );

  if (otherMembershipError) {
    throw new Error(
      otherMembershipError.message
    );
  }

  const matchingConversationIds = (
    otherUserMemberships ?? []
  ).map(
    (membership) =>
      membership.conversation_id
  );

  if (matchingConversationIds.length === 0) {
    return null;
  }

  const {
    data: membershipCounts,
    error: countError,
  } = await supabase
    .from("conversation_members")
    .select(
      "conversation_id, user_id, joined_at"
    )
    .in(
      "conversation_id",
      matchingConversationIds
    );

  if (countError) {
    throw new Error(countError.message);
  }

  const groupedCounts = new Map<
    string,
    number
  >();

  for (const membership of membershipCounts ?? []) {
    groupedCounts.set(
      membership.conversation_id,
      (groupedCounts.get(
        membership.conversation_id
      ) ?? 0) + 1
    );
  }

  for (
    const conversationId of
    matchingConversationIds
  ) {
    if (
      groupedCounts.get(
        conversationId
      ) === 2
    ) {
      return conversationId;
    }
  }

  return null;
}

export async function createDirectConversation(
  _currentUserId: string,
  otherUserId: string
): Promise<string> {
  if (!otherUserId) {
    throw new Error(
      "The user you want to message is missing."
    );
  }

  const { data, error } = await supabase.rpc(
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
      "The conversation could not be created."
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
      error: membershipsError,
    } = await supabase
      .from("conversation_members")
      .select(
        "conversation_id, user_id, joined_at"
      )
      .eq("user_id", currentUserId);

    if (membershipsError) {
      throw new Error(
        membershipsError.message
      );
    }

    const conversationIds = (
      memberships ?? []
    ).map(
      (membership) =>
        membership.conversation_id
    );

    if (conversationIds.length === 0) {
      return [];
    }

    const {
      data: conversations,
      error: conversationsError,
    } = await supabase
      .from("conversations")
      .select(
        "id, created_at, updated_at"
      )
      .in("id", conversationIds)
      .order("updated_at", {
        ascending: false,
      });

    if (conversationsError) {
      throw new Error(
        conversationsError.message
      );
    }

    const {
      data: allMembers,
      error: allMembersError,
    } = await supabase
      .from("conversation_members")
      .select(
        "conversation_id, user_id, joined_at"
      )
      .in(
        "conversation_id",
        conversationIds
      );

    if (allMembersError) {
      throw new Error(
        allMembersError.message
      );
    }

    const memberRows =
      (allMembers ??
        []) as ConversationMemberRow[];

    const otherUserIds = Array.from(
      new Set(
        memberRows
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
        data: loadedProfiles,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url"
        )
        .in("id", otherUserIds);

      if (profilesError) {
        throw new Error(
          profilesError.message
        );
      }

      profiles =
        (loadedProfiles ??
          []) as MessageProfile[];
    }

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const previews = await Promise.all(
      (conversations ?? []).map(
        async (conversation) => {
          const otherMember =
            memberRows.find(
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
            error: lastMessageError,
          } = await supabase
            .from("messages")
            .select(
              "id, conversation_id, sender_id, content, created_at, read_at"
            )
            .eq(
              "conversation_id",
              conversation.id
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(1);

          if (lastMessageError) {
            throw new Error(
              lastMessageError.message
            );
          }

          const {
            count: unreadCount,
            error: unreadError,
          } = await supabase
            .from("messages")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "conversation_id",
              conversation.id
            )
            .neq(
              "sender_id",
              currentUserId
            )
            .is("read_at", null);

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
              unreadCount ?? 0,
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