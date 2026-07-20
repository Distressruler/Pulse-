"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  House,
  MessageCircle,
  Search,
  User,
} from "lucide-react";

type AppNavProps = {
  currentUserId: string;
};

export default function AppNav({
  currentUserId,
}: AppNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const links = [
    {
      label: "Feed",
      path: "/feed",
      icon: House,
    },
    {
      label: "Search",
      path: "/search",
      icon: Search,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: Bell,
    },
    {
      label: "Messages",
      path: "/messages",
      icon: MessageCircle,
    },
    {
      label: "Profile",
      path: `/profile/${currentUserId}`,
      icon: User,
    },
  ];

  return (
    <nav className="mb-8 overflow-x-auto rounded-3xl border border-pink-100 bg-white/90 p-3 shadow-sm backdrop-blur">
      <div className="flex min-w-max items-center gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.path;

          return (
            <button
              key={link.label}
              type="button"
              onClick={() => router.push(link.path)}
              aria-label={link.label}
              className={
                active
                  ? "flex items-center gap-2 rounded-full bg-pink-400 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-pink-500"
                  : "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-pink-50 hover:text-pink-500"
              }
            >
              <Icon size={19} strokeWidth={2.2} />

              <span className="hidden sm:inline">
                {link.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}