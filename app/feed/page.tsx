"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import AppNav from "@/components/navigation/AppNav";
import FeedHeader from "@/components/feed/FeedHeader";
import PostCard from "@/components/feed/PostCard";
import PostComposer from "@/components/feed/PostComposer";

import { supabase } from "@/lib/supabase";

import {
  createPost,
  deletePost,
  getPosts,
} from "@/lib/services/posts";

import {
  addLike,
  getLikes,
  removeLike,
} from "@/lib/services/likes";

import {
  getProfile,
  getProfiles,
} from "@/lib/services/profiles";

import {
  createComment,
  deleteComment,
  getComments,
} from "@/lib/services/comments";

import type {
  Comment,
  Like,
  Post,
  Profile,
} from "@/types/social";

export default function FeedPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, Profile>
  >({});
  const [likes, setLikes] = useState<Like[]>([]);
  const [comments, setComments] = useState<Comment[]>(
    []
  );

  const [content, setContent] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] =
    useState(false);
  const [message, setMessage] = useState("");

  const loadFeed = useCallback(async () => {
    try {
      setMessage("");

      const loadedPosts = await getPosts();
      setPosts(loadedPosts);

      const postIds = loadedPosts.map(
        (post) => post.id
      );

      const [loadedLikes, loadedComments] =
        await Promise.all([
          getLikes(postIds),
          getComments(postIds),
        ]);

      setLikes(loadedLikes);
      setComments(loadedComments);

      const postAuthorIds = loadedPosts.map(
        (post) => post.author_id
      );

      const commentAuthorIds = loadedComments.map(
        (comment) => comment.author_id
      );

      const authorIds = [
        ...new Set([
          ...postAuthorIds,
          ...commentAuthorIds,
        ]),
      ];

      const loadedProfiles = await getProfiles(
        authorIds
      );

      setProfiles(loadedProfiles);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load the feed."
      );
    }
  }, []);

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        router.refresh();
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      try {
        const profile = await getProfile(user.id);

        setUsername(
          profile?.username ??
            profile?.display_name ??
            ""
        );

        await loadFeed();
      } catch (profileError) {
        setMessage(
          profileError instanceof Error
            ? profileError.message
            : "Could not load your profile."
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadPage();
  }, [loadFeed, router]);

  async function handleCreatePost(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanContent = content.trim();

    if (!cleanContent) {
      setMessage("Write something before posting.");
      return;
    }

    if (cleanContent.length > 500) {
      setMessage(
        "Posts cannot exceed 500 characters."
      );
      return;
    }

    try {
      setPosting(true);
      setMessage("");

      await createPost(userId, cleanContent);

      setContent("");
      await loadFeed();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create the post."
      );
    } finally {
      setPosting(false);
    }
  }

  async function handleDeletePost(postId: number) {
    try {
      setMessage("");

      await deletePost(postId);
      await loadFeed();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete the post."
      );
    }
  }

  async function handleToggleLike(postId: number) {
    const alreadyLiked = likes.some(
      (like) =>
        like.post_id === postId &&
        like.user_id === userId
    );

    try {
      setMessage("");

      if (alreadyLiked) {
        await removeLike(postId, userId);
      } else {
        await addLike(postId, userId);
      }

      await loadFeed();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update the like."
      );
    }
  }

  async function handleCreateComment(
    postId: number,
    commentContent: string
  ) {
    const cleanComment = commentContent.trim();

    if (!cleanComment) {
      setMessage("Write something before replying.");
      return;
    }

    if (cleanComment.length > 300) {
      setMessage(
        "Comments cannot exceed 300 characters."
      );
      return;
    }

    try {
      setCommentSubmitting(true);
      setMessage("");

      await createComment(
        postId,
        userId,
        cleanComment
      );

      await loadFeed();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create the comment."
      );

      throw error;
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleDeleteComment(
    commentId: number
  ) {
    try {
      setMessage("");

      await deleteComment(commentId);
      await loadFeed();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete the comment."
      );
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50 text-gray-900">
        <div className="rounded-2xl border border-pink-100 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm font-medium text-pink-500">
            Loading Pulse...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-rose-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AppNav currentUserId={userId} />

        <FeedHeader
          username={username}
          email={email}
          onLogout={handleLogout}
        />

        <PostComposer
          content={content}
          posting={posting}
          onContentChange={setContent}
          onSubmit={handleCreatePost}
        />

        {message && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 shadow-sm">
            {message}
          </p>
        )}

        <section className="mt-8 space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-xl">
                🩷
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                No posts yet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Publish the first thought on Pulse.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={profiles[post.author_id]}
                likes={likes}
                comments={comments}
                profiles={profiles}
                currentUserId={userId}
                commentSubmitting={commentSubmitting}
                onDelete={handleDeletePost}
                onToggleLike={handleToggleLike}
                onCreateComment={handleCreateComment}
                onDeleteComment={
                  handleDeleteComment
                }
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}