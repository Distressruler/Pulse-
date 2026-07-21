"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
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
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 overflow-x-auto rounded-3xl border border-pink-100 bg-white/90 p-3 shadow-lg backdrop-blur">
      <div className="flex min-w-max items-center justify-center gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.path;

          return (
            <motion.button
              key={link.label}
              type="button"
              onClick={() => router.push(link.path)}
              aria-label={link.label}
              whileTap={{ scale: 0.96 }}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition ${
                active
                  ? "font-bold text-white"
                  : "font-semibold text-gray-600 hover:bg-pink-50 hover:text-pink-500"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-full bg-pink-400"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              <Icon
                size={19}
                strokeWidth={2.2}
                className="relative z-10"
              />

              <span className="relative z-10 hidden sm:inline">
                {link.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}