import { PenSquare } from "lucide-react";

type PostComposerProps = {
  content: string;
  posting: boolean;
  onContentChange: (content: string) => void;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;
};

export default function PostComposer({
  content,
  posting,
  onContentChange,
  onSubmit,
}: PostComposerProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-3xl border border-pink-100 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-100">
          <PenSquare
            size={20}
            className="text-pink-500"
          />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            Create a Post
          </h2>

          <p className="text-sm text-gray-500">
            Share what's happening with everyone.
          </p>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(event) =>
          onContentChange(event.target.value)
        }
        maxLength={500}
        placeholder="What's on your mind today?"
        className="min-h-32 w-full resize-none rounded-2xl border border-pink-100 bg-pink-50 p-4 text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-200 placeholder:text-gray-400"
      />

      <div className="mt-5 flex items-center justify-between border-t border-pink-100 pt-5">
        <span className="text-sm font-medium text-gray-500">
          {content.length}/500
        </span>

        <button
          type="submit"
          disabled={posting || !content.trim()}
          className="rounded-full bg-pink-500 px-7 py-2.5 font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}