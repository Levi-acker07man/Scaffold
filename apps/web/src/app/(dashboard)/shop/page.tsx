"use client";

import React, { useState } from "react";
import { useShop, SHOP_THEMES, ShopThemeItem } from "@/shared/context/ShopContext";
import { useBackground } from "@/shared/context/BackgroundContext";

export default function ShopPage() {
  const { coins, isUnlocked, purchaseTheme } = useShop();
  const { background, setBackground } = useBackground();
  const [filter, setFilter] = useState<"all" | "static" | "live">("all");
  const [justPurchased, setJustPurchased] = useState<string | null>(null);

  const filteredThemes = SHOP_THEMES.filter((item) => {
    if (filter === "static") return item.type === "static";
    if (filter === "live") return item.type === "live";
    return true;
  });

  const handlePurchase = async (item: ShopThemeItem) => {
    const success = await purchaseTheme(item.id, item.price);
    if (success) {
      setJustPurchased(item.id);
      setTimeout(() => {
        setJustPurchased(null);
      }, 3500);
    }
  };

  const handleEquip = (item: ShopThemeItem) => {
    setBackground({ type: item.type, value: item.id });
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-2 pb-32 block min-h-0">
      {/* ── Hero Banner ── */}
      <div className="w-full shrink-0 relative overflow-hidden rounded-3xl p-6 md:p-10 mb-8 border border-clay-border bg-gradient-to-br from-panel via-panel to-panel/90 shadow-lg">
        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-accent-base/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -top-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl shrink-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-text tracking-tight">
              Wallpaper & Theme
            </h1>
          </div>

          {/* Wallet Card */}
          <div className="flex items-center justify-center bg-black/10 dark:bg-white/5 border border-clay-border p-6 rounded-2xl backdrop-blur-md w-full lg:w-auto shrink-0 shadow-inner">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-extrabold text-yellow-500 drop-shadow-sm">🪙</span>
              <span className="text-3xl md:text-4xl font-black text-text font-mono">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center flex-wrap gap-4 mt-8 pt-6 border-t border-clay-border/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === "all"
                ? "bg-accent-base text-black shadow-md shadow-accent-base/20"
                : "bg-black/5 dark:bg-white/5 text-text-dim hover:text-text"
                }`}
            >
              All Themes ({SHOP_THEMES.length})
            </button>
            <button
              onClick={() => setFilter("static")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === "static"
                ? "bg-accent-base text-black shadow-md shadow-accent-base/20"
                : "bg-black/5 dark:bg-white/5 text-text-dim hover:text-text"
                }`}
            >
              Static Wallpapers ({SHOP_THEMES.filter((t) => t.type === "static").length})
            </button>
            <button
              onClick={() => setFilter("live")}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === "live"
                ? "bg-accent-base text-black shadow-md shadow-accent-base/20"
                : "bg-black/5 dark:bg-white/5 text-text-dim hover:text-text"
                }`}
            >
              Live Wallpapers ({SHOP_THEMES.filter((t) => t.type === "live").length})
            </button>
          </div>
        </div>
      </div>

      {/* ── Shop Items Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((item) => {
          const unlocked = isUnlocked(item.id);
          const canAfford = coins >= item.price;
          const isCurrentlyEquipped = background.value === item.id;
          const isCelebrated = justPurchased === item.id;

          return (
            <div
              key={item.id}
              className={`clay group relative flex flex-col justify-between rounded-3xl overflow-hidden border transition-all duration-300 ${unlocked
                  ? "border-emerald-500/40 bg-panel shadow-sm hover:shadow-md"
                  : "border-clay-border bg-panel hover:border-accent-base/50 shadow-sm hover:shadow-lg hover:-translate-y-1"
                }`}
            >
              {/* Top Image / Live Preview Area */}
              <div className="relative h-52 w-full overflow-hidden bg-black/10">
                {item.type === "static" && item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`w-full h-full ${item.id} relative overflow-hidden`} />
                )}

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider">
                    {item.type === "static" ? "Static Wallpaper" : "Live Animated"}
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  {unlocked ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-black shadow-lg flex items-center gap-1.5">
                      <span>✅ OWNED</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-xs font-black shadow-lg flex items-center gap-1.5 border border-amber-400/40">
                      <span>🔒 LOCKED</span>
                    </span>
                  )}
                </div>

                {/* Celebratory Overlay on Just Purchased */}
                {isCelebrated && (
                  <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-20 animate-fade-in">
                    <div className="bg-emerald-500 text-black px-4 py-2 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
                      <span>🎉 Permanently Unlocked!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-text tracking-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 font-mono font-black text-yellow-500 text-base">
                      <span>🪙</span>
                      <span>{item.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-clay-border/50 flex items-center gap-3">
                  {unlocked ? (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => handleEquip(item)}
                        disabled={isCurrentlyEquipped}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${isCurrentlyEquipped
                            ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-default"
                            : "bg-accent-base hover:opacity-90 text-black shadow-md cursor-pointer"
                          }`}
                      >
                        {isCurrentlyEquipped ? (
                          <>
                            <span>✓ Equipped as Background</span>
                          </>
                        ) : (
                          <>
                            <span>✨ Equip Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford}
                      className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${canAfford
                          ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:brightness-110 text-black shadow-lg shadow-amber-500/20 cursor-pointer active:scale-[0.98]"
                          : "bg-black/10 dark:bg-white/5 border border-clay-border text-text-dim cursor-not-allowed opacity-60"
                        }`}
                    >
                      <span>🪙 {item.price.toLocaleString()}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
