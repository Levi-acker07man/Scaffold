"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export type BackgroundType = {
  type: "static" | "live";
  value: string;
};

interface BackgroundContextType {
  background: BackgroundType;
  setBackground: (bg: BackgroundType) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBgState] = useState<BackgroundType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("scaffold_background_preference");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          // ignore parse error
        }
      }
    }
    return {
      type: "live",
      value: "live-auth",
    };
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchBackground = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.background) {
        setBgState(session.user.user_metadata.background);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "scaffold_background_preference",
            JSON.stringify(session.user.user_metadata.background)
          );
        }
      } else {
        setBgState({ type: "live", value: "live-auth" });
      }
    };
    fetchBackground();
  }, []);

  const setBackground = async (bg: BackgroundType) => {
    setBgState(bg);
    if (typeof window !== "undefined") {
      localStorage.setItem("scaffold_background_preference", JSON.stringify(bg));
    }
    await supabase.auth.updateUser({
      data: { background: bg }
    });
  };

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
}
