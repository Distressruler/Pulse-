"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handler as EventListener
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler as EventListener
      );
    };
  }, []);

  async function installApp() {
    if (!promptEvent) return;

    promptEvent.prompt();

    await promptEvent.userChoice;

    setPromptEvent(null);
  }

  if (!promptEvent) return null;

  return (
    <button
      onClick={installApp}
      className="fixed bottom-24 right-5 z-50 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-white shadow-xl transition hover:bg-pink-600"
    >
      <Download size={18} />
      Install Pulse
    </button>
  );
}