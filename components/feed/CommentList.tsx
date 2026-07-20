"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import type {
  Comment,
  Profile,
} from "@/types/social";

type CommentListProps = {
  comments: Comment[];
  profiles: Record<string, Profile>;
  currentUserId: string;
  onDelete: (commentId: number) => void;
};

export default function CommentList({
  comments,
  profiles,
  currentUserId,
  onDelete,
}: CommentListProps) {
  const router = useRouter();

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-3">
      {comments.map((comment) => {
        const author =
          profiles[comment.author_id];

        const authorName =
          author?.username ??
          author?.display_name ??
          "pulse-user";

        const avatarLetter = authorName
          .charAt(0)
          .toUpperCase();

        return (
          <div
            key={comment.id}
            className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/profile/${comment.author_id}`
                  )
                }
                className="flex items-start gap-3 text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-200 font-bold text-pink-600">
                  {author?.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={authorName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>

                <div>
                  <p className="font-semibold text-gray-900 hover:text-pink-500">
                    @{authorName}
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                    {comment.content}
                  </p>
                </div>
              </button>

              {comment.author_id ===
                currentUserId && (
                <button
                  type="button"
                  onClick={() =>
                    onDelete(comment.id)
                  }
                  className="rounded-full p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}