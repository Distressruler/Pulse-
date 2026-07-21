"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
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

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("recipient_id", currentUserId)
        .eq("is_read", false);

      if (!error) {
        setUnreadCount(count ?? 0);
      }
    }

    loadUnreadCount();

    const channel = supabase
      .channel(`notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const links = [
    {
      path: "/feed",
      icon: House,
      label: "Feed",
    },
    {
      path: "/search",
      icon: Search,
      label: "Search",
    },
    {
      path: "/notifications",
      icon: Bell,
      label: "Notifications",
    },
    {
      path: "/messages",
      icon: MessageCircle,
      label: "Messages",
    },
    {
      path: `/profile/${currentUserId}`,
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-3xl border border-pink-100 bg-white/95 p-2 shadow-2xl">
      <div className="flex items-center justify-between">
        {links.map((link) => {
          const Icon = link.icon;

          const active =
            pathname === link.path ||
            (link.path === "/messages" &&
              pathname.startsWith("/messages/"));

          return (
            <motion.button
              key={link.path}
              type="button"
              aria-label={link.label}
              onClick={() => router.push(link.path)}
              whileTap={{
                scale: 0.9,
              }}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
            >
              {active && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500"
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 38,
                    mass: 0.7,
                  }}
                />
              )}

              <motion.div
                className="relative z-10"
                animate={{
                  scale: active ? 1.15 : 1,
                  y: active ? -1 : 0,
                  rotate: active ? 2 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 24,
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={2.2}
                  className={
                    active
                      ? "text-white"
                      : "text-gray-500"
                  }
                />
              </motion.div>

              {link.path === "/notifications" &&
                unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}