"use client";

import { useState } from "react";

type CommentFormProps = {
  postId: number;
  submitting: boolean;
  onSubmit: (postId: number, content: string) => Promise<void>;
};

export default function CommentForm({
  postId,
  submitting,
  onSubmit,
}: CommentFormProps) {
  const [content, setContent] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanContent = content.trim();

    if (!cleanContent) {
      return;
    }

    await onSubmit(postId, cleanContent);
    setContent("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex items-center gap-3"
    >
      <input
        type="text"
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
        maxLength={300}
        placeholder="Write a comment..."
        className="min-w-0 flex-1 rounded-full border border-gray-700 bg-black px-4 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-gray-500"
      />

      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "..." : "Reply"}
      </button>
    </form>
  );
}