"use client";

import { useBackground } from "@/shared/context/BackgroundContext";
import { useEffect, useState } from "react";

export function AmbientBackground() {
  const { background } = useBackground();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="ambient" aria-hidden="true">
        <div
          className="ambient-image"
          style={{
            backgroundImage: "url('/Fantasy-Autumn.png')",
          }}
        />
      </div>
    );
  }

  return (
    <div className={`ambient ${background.type === 'live' ? background.value : ''}`} aria-hidden="true">
      {background.type === 'static' ? (
        <div
          className="ambient-image transition-all duration-700"
          style={{
            backgroundImage: `url('${background.value}')`,
          }}
        />
      ) : (
        <div className="ambient-live-overlay" />
      )}
    </div>
  );
}

