export type Post = {
  id: number;
  author_id: string;
  content: string;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at?: string;
};

export type Like = {
  post_id: number;
  user_id: string;
};

export type Comment = {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
};export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};