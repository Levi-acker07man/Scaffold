"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
    });

    // Lenis autoRaf handles the requestAnimationFrame loop automatically

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
