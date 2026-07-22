"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export default function InstallButton() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  async function installApp() {
    if (!promptEvent) return;

    await promptEvent.prompt();
    await promptEvent.userChoice;

    setPromptEvent(null);
  }

  if (!promptEvent) return null;

  return (
    <button
      type="button"
      onClick={installApp}
      className="fixed bottom-24 right-5 z-50 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-white shadow-xl transition hover:bg-pink-600"
    >
      <Download size={18} />
      Install Pulse
    </button>
  );
}