"use client";

import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Trash2,
} from "lucide-react";

import CommentForm from "@/components/feed/CommentForm";
import CommentList from "@/components/feed/CommentList";

import type {
  Comment,
  Like,
  Post,
  Profile,
} from "@/types/social";

type PostCardProps = {
  post: Post;
  author?: Profile;
  likes: Like[];
  comments: Comment[];
  profiles: Record<string, Profile>;
  currentUserId: string;
  commentSubmitting: boolean;
  onDelete: (postId: number) => void;
  onToggleLike: (postId: number) => void;
  onCreateComment: (
    postId: number,
    content: string
  ) => Promise<void>;
  onDeleteComment: (commentId: number) => void;
};

export default function PostCard({
  post,
  author,
  likes,
  comments,
  profiles,
  currentUserId,
  commentSubmitting,
  onDelete,
  onToggleLike,
  onCreateComment,
  onDeleteComment,
}: PostCardProps) {
  const router = useRouter();

  const authorName =
    author?.username ??
    author?.display_name ??
    "pulse-user";

  const avatarLetter = authorName
    .charAt(0)
    .toUpperCase();

  const postLikes = likes.filter(
    (like) => like.post_id === post.id
  );

  const postComments = comments.filter(
    (comment) => comment.post_id === post.id
  );

  const likedByCurrentUser = postLikes.some(
    (like) => like.user_id === currentUserId
  );

  return (
    <article className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            router.push(`/profile/${post.author_id}`)
          }
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-100 font-bold text-pink-500">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={`${authorName}'s avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              avatarLetter
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900 transition hover:text-pink-500">
              @{authorName}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {new Date(
                post.created_at
              ).toLocaleString()}
            </p>
          </div>
        </button>

        {post.author_id === currentUserId && (
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            aria-label="Delete post"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      <p className="mt-5 whitespace-pre-wrap break-words leading-7 text-gray-700">
        {post.content}
      </p>

      <div className="mt-5 flex items-center gap-6 border-t border-pink-100 pt-4">
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          className={
            likedByCurrentUser
              ? "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-pink-500 transition hover:bg-pink-50"
              : "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-pink-50 hover:text-pink-500"
          }
        >
          <Heart
            size={20}
            strokeWidth={2.2}
            fill={
              likedByCurrentUser
                ? "currentColor"
                : "none"
            }
          />

          <span>{postLikes.length}</span>
        </button>

        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <MessageCircle
            size={20}
            strokeWidth={2.2}
          />

          <span>
            {postComments.length}{" "}
            {postComments.length === 1
              ? "comment"
              : "comments"}
          </span>
        </div>
      </div>

      <CommentList
        comments={postComments}
        profiles={profiles}
        currentUserId={currentUserId}
        onDelete={onDeleteComment}
      />

      <CommentForm
        postId={post.id}
        submitting={commentSubmitting}
        onSubmit={onCreateComment}
      />
    </article>
  );
}