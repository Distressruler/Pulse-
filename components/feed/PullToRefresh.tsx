"use client";

import {
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { RefreshCw } from "lucide-react";

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<void>;
};

const REFRESH_THRESHOLD = 65;
const MAX_PULL_DISTANCE = 90;

export default function PullToRefresh({
  children,
  onRefresh,
}: PullToRefreshProps) {
  const touchStartY = useRef<number | null>(null);

  const [pullDistance, setPullDistance] =
    useState(0);

  const [refreshing, setRefreshing] =
    useState(false);

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (window.scrollY > 0 || refreshing) {
      touchStartY.current = null;
      return;
    }

    touchStartY.current =
      event.touches[0].clientY;
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (
      touchStartY.current === null ||
      refreshing ||
      window.scrollY > 0
    ) {
      return;
    }

    const currentY = event.touches[0].clientY;
    const distance =
      currentY - touchStartY.current;

    if (distance <= 0) {
      setPullDistance(0);
      return;
    }

    const resistedDistance = Math.min(
      distance * 0.45,
      MAX_PULL_DISTANCE
    );

    setPullDistance(resistedDistance);
  }

  async function handleTouchEnd() {
    touchStartY.current = null;

    if (
      pullDistance < REFRESH_THRESHOLD ||
      refreshing
    ) {
      setPullDistance(0);
      return;
    }

    setRefreshing(true);
    setPullDistance(55);

    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }

  const readyToRefresh =
    pullDistance >= REFRESH_THRESHOLD;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{
          height: `${pullDistance}px`,
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-pink-500">
          <RefreshCw
            size={20}
            className={
              refreshing
                ? "animate-spin"
                : readyToRefresh
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
            }
          />

          <span>
            {refreshing
              ? "Refreshing..."
              : readyToRefresh
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}