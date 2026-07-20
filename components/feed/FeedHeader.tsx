"use client";

import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";

type FeedHeaderProps = {
  username: string;
  email: string;
  onLogout: () => void;
};

export default function FeedHeader({
  username,
  email,
  onLogout,
}: FeedHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex flex-col gap-5 rounded-3xl border border-pink-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
          Welcome back
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Pulse
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {username ? `@${username}` : email}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-semibold text-pink-600 transition hover:border-pink-300 hover:bg-pink-100"
        >
          <Search size={18} strokeWidth={2.2} />
          <span className="hidden sm:inline">Search</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={18} strokeWidth={2.2} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
}