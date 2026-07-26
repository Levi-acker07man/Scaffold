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
  const [background, setBgState] = useState<BackgroundType>({
    type: "static",
    value: "/Fantasy-Autumn.png",
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchBackground = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.background) {
        setBgState(session.user.user_metadata.background);
      }
    };
    fetchBackground();
  }, []);

  const setBackground = async (bg: BackgroundType) => {
    setBgState(bg);
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
