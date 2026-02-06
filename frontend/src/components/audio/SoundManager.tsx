import React, { useEffect, useRef, useState } from "react";

const SOUND_URL = "/sounds/cabin-ambience.mp3";
const STORAGE_KEY = "battle-ship-sound-enabled";

const COLORS = {
  darkGreen: "#1E3D2F",
  orange: "#D97A1F"
};

export const SoundManager: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "1";
  });

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(SOUND_URL);
      audio.loop = true;
      audio.volume = 0.35;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (enabled) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(() => {
          // Autoplay puede ser bloqueado por el navegador; no hacemos nada.
        });
      }
    } else {
      audio.pause();
    }
  }, [enabled]);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignorar errores de almacenamiento
      }
      return next;
    });
  };

  const isOn = enabled;

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg smooth-transition"
        style={{
          backgroundColor: isOn ? COLORS.darkGreen : COLORS.orange,
          color: "#FFFFFF",
          borderRadius: 9999
        }}
        aria-label={isOn ? "Mute ambient sound" : "Unmute ambient sound"}
      >
        <span aria-hidden className="text-base sm:text-lg">
          {isOn ? "🔊" : "🔇"}
        </span>
      </button>
    </div>
  );
};

