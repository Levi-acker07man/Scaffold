"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface ShopThemeItem {
  id: string;
  name: string;
  description: string;
  type: "static" | "live";
  price: number;
  previewUrl?: string;
}

export const SHOP_THEMES: ShopThemeItem[] = [
  {
    id: "/Fantasy-Lake1.png",
    name: "Serene Lake",
    description: "Tranquil waters surrounded by autumn mountains and glowing forests",
    type: "static",
    price: 600,
    previewUrl: "/Fantasy-Lake1.png",
  },
  {
    id: "/Minimal_Squares.png",
    name: "Minimal Geometric",
    description: "Clean modern abstract squares for distraction-free focus",
    type: "static",
    price: 600,
    previewUrl: "/Minimal_Squares.png",
  },
  {
    id: "live-nebula",
    name: "Deep Nebula",
    description: "Vibrant animated deep cosmos with drifting starfields and plasma waves",
    type: "live",
    price: 600,
  },
  {
    id: "live-celestial",
    name: "Celestial Horizon",
    description: "Dynamic Day & Night theme: Sunny sky with green meadows in Light Mode, Starry night sky with glowing moon in Dark Mode",
    type: "live",
    price: 600,
  },
  {
    id: "bg-static-zen",
    name: "Zenith Garden",
    description: "Tranquil Japanese bamboo grove & bonsai sanctuary with emerald golden light shafts",
    type: "static",
    price: 1600,
  },
  {
    id: "bg-static-aurora",
    name: "Northern Aurora",
    description: "Majestic Arctic night sky illuminated by shimmering green and violet aurora borealis",
    type: "static",
    price: 1600,
  },
  {
    id: "live-matrix",
    name: "Cyber Matrix Pulse",
    description: "Futuristic animated emerald data streams and glowing cybernetic grid pulses",
    type: "live",
    price: 1600,
  },
  {
    id: "live-sakura",
    name: "Sakura Blossom Breeze",
    description: "Breathtaking springtime cherry blossom sanctuary with gently floating sakura petals",
    type: "live",
    price: 1600,
  },
];

// Free default themes that are always unlocked for everyone
// Free default themes that are always unlocked for everyone
export const FREE_THEMES = ["live-auth", "/Fantasy-Autumn.png", "live-aurora"];

export function getLevelInfo(totalXp: number) {
  let level = 1;
  let xpNeeded = 100;
  let currentLevelXp = totalXp;
  while (currentLevelXp >= xpNeeded) {
    currentLevelXp -= xpNeeded;
    level += 1;
    xpNeeded = 100 * level;
  }
  return {
    level,
    currentLevelXp,
    xpNeeded,
  };
}

interface ShopContextType {
  coins: number;
  xp: number;
  level: number;
  currentLevelXp: number;
  xpNeeded: number;
  unlockedThemes: string[];
  purchaseTheme: (themeId: string, price: number) => Promise<boolean>;
  isUnlocked: (themeId: string) => boolean;
  addReward: (xpAmount: number, coinAmount: number) => Promise<void>;
  subtractReward: (xpAmount: number, coinAmount: number) => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("scaffold_coins");
      if (stored !== null && !isNaN(Number(stored))) {
        return Number(stored);
      }
    }
    return 1200; // Give new users 1200 coins so they can purchase themes in the shop
  });

  const [xp, setXp] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("scaffold_xp");
      if (stored !== null && !isNaN(Number(stored))) {
        return Number(stored);
      }
    }
    return 0;
  });

  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("scaffold_unlocked_themes");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
    }
    return [];
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchShopData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.user_metadata) {
        const meta = session.user.user_metadata;
        if (typeof meta.coins === "number") {
          setCoins(meta.coins);
          if (typeof window !== "undefined") {
            localStorage.setItem("scaffold_coins", meta.coins.toString());
          }
        }
        if (typeof meta.xp === "number") {
          setXp(meta.xp);
          if (typeof window !== "undefined") {
            localStorage.setItem("scaffold_xp", meta.xp.toString());
          }
        }
        if (Array.isArray(meta.unlockedThemes)) {
          setUnlockedThemes(meta.unlockedThemes);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "scaffold_unlocked_themes",
              JSON.stringify(meta.unlockedThemes)
            );
          }
        }
      }
    };
    fetchShopData();
  }, []);

  const { level, currentLevelXp, xpNeeded } = getLevelInfo(xp);

  const isUnlocked = (themeId: string) => {
    return FREE_THEMES.includes(themeId) || unlockedThemes.includes(themeId);
  };

  const addReward = async (xpAmount: number, coinAmount: number) => {
    const nextXp = Math.max(0, Number((xp + xpAmount).toFixed(1)));
    const nextCoins = Math.max(0, Number((coins + coinAmount).toFixed(1)));
    setXp(nextXp);
    setCoins(nextCoins);
    if (typeof window !== "undefined") {
      localStorage.setItem("scaffold_xp", nextXp.toString());
      localStorage.setItem("scaffold_coins", nextCoins.toString());
    }
    try {
      await supabase.auth.updateUser({
        data: {
          xp: nextXp,
          coins: nextCoins,
        },
      });
    } catch (e) {
      console.error("Failed to update user rewards:", e);
    }
  };

  const subtractReward = async (xpAmount: number, coinAmount: number) => {
    const nextXp = Math.max(0, Number((xp - xpAmount).toFixed(1)));
    const nextCoins = Math.max(0, Number((coins - coinAmount).toFixed(1)));
    setXp(nextXp);
    setCoins(nextCoins);
    if (typeof window !== "undefined") {
      localStorage.setItem("scaffold_xp", nextXp.toString());
      localStorage.setItem("scaffold_coins", nextCoins.toString());
    }
    try {
      await supabase.auth.updateUser({
        data: {
          xp: nextXp,
          coins: nextCoins,
        },
      });
    } catch (e) {
      console.error("Failed to update user rewards:", e);
    }
  };

  const purchaseTheme = async (themeId: string, price: number): Promise<boolean> => {
    if (isUnlocked(themeId)) return true;
    if (coins < price) return false;

    const nextCoins = coins - price;
    const nextUnlocked = [...unlockedThemes, themeId];

    setCoins(nextCoins);
    setUnlockedThemes(nextUnlocked);

    if (typeof window !== "undefined") {
      localStorage.setItem("scaffold_coins", nextCoins.toString());
      localStorage.setItem("scaffold_unlocked_themes", JSON.stringify(nextUnlocked));
    }

    try {
      await supabase.auth.updateUser({
        data: {
          coins: nextCoins,
          unlockedThemes: nextUnlocked,
        },
      });
    } catch (e) {
      console.error("Failed to update user shop metadata:", e);
    }

    return true;
  };

  return (
    <ShopContext.Provider
      value={{
        coins,
        xp,
        level,
        currentLevelXp,
        xpNeeded,
        unlockedThemes,
        purchaseTheme,
        isUnlocked,
        addReward,
        subtractReward,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
