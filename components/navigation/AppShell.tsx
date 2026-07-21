"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppNav from "@/components/navigation/AppNav";
import { supabase } from "@/lib/supabase";
import PageTransition from "@/components/layout/PageTransition";

type AppShellProps = {
  children: React.ReactNode;
};

const hiddenNavigationPaths = [
  "/login",
  "/signup",
];

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const hideNavigation = hiddenNavigationPaths.some(
    (path) => pathname.startsWith(path)
  );

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setCurrentUserId(user?.id ?? null);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
     <main
  className={
    currentUserId && !hideNavigation
      ? "flex-1 pb-28"
      : "flex-1"
  }
>
  <PageTransition>{children}</PageTransition>
</main>

      {currentUserId && !hideNavigation && (
        <AppNav currentUserId={currentUserId} />
      )}
    </>
  );
}