"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer opacity-50" style={{
      background: "var(--clay-bg)",
      border: "1.5px solid var(--clay-border)",
      boxShadow: "var(--clay-shadow)",
    }}></div>
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
      style={{
        background: "var(--clay-bg)",
        border: "1.5px solid var(--clay-border)",
        boxShadow: "var(--clay-shadow)",
      }}
      title="Toggle Theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-accent-base" />
      ) : (
        <Moon className="h-5 w-5 text-accent-base" />
      )}
    </button>
  )
}
