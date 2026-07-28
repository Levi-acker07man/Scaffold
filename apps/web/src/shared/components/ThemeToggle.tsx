"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { createPortal } from "react-dom"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [opacity, setOpacity] = React.useState<number>(0.85)
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, right: 0 })

  React.useEffect(() => {
    const stored = localStorage.getItem("scaffold_ambient_opacity")
    if (stored !== null) {
      setOpacity(Number(stored))
    } else {
      // Check current document class for dark theme as fallback during mount
      const isDarkInit = document.documentElement.classList.contains("dark") || theme === "dark"
      setOpacity(isDarkInit ? 0.95 : 0.85)
    }
    setMounted(true)
  }, [])

  // Apply opacity to document element
  React.useEffect(() => {
    if (!mounted) return
    document.documentElement.style.setProperty("--ambient-tint-opacity", opacity.toString())
    localStorage.setItem("scaffold_ambient_opacity", opacity.toString())
  }, [opacity, mounted])

  const btnRef = React.useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      })
    }
    setIsOpen(!isOpen)
  }

  // Handle outside click
  React.useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('theme-dropdown-portal')
        if (portal && portal.contains(e.target as Node)) return
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [isOpen])

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer opacity-50" style={{
      background: "var(--clay-bg)",
      border: "1.5px solid var(--clay-border)",
      boxShadow: "var(--clay-shadow)",
    }}></div>
  }

  const isDark = theme === "dark"

  const dropdown = (
    isOpen ? (
      <div 
        id="theme-dropdown-portal"
        className="w-64 p-5 rounded-3xl bg-white dark:bg-panel border border-clay-border flex flex-col gap-5 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-200"
        style={{
          position: 'fixed',
          top: dropdownPos.top,
          right: dropdownPos.right,
          zIndex: 9999
        }}
      >
        {/* Theme Selection */}
        <div className="flex flex-col gap-3 border-b border-black/5 dark:border-white/5 pb-4">
          <span className="text-sm font-black text-text uppercase tracking-wider">Theme Mode</span>
          <div className="flex items-center bg-input-bg border border-clay-border rounded-xl p-1 gap-1">
            <button 
              onClick={() => setTheme('light')} 
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isDark ? 'bg-white shadow-sm text-text' : 'text-text-dim hover:text-text hover:bg-black/5'}`}
            >
              Light
            </button>
            <button 
              onClick={() => setTheme('dark')} 
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-gray-800 shadow-sm text-white' : 'text-text-dim hover:text-text hover:bg-black/5'}`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-text uppercase tracking-wider">Background Tint</span>
            <span className="text-xs font-black text-text-dim px-2 py-0.5 rounded-md bg-input-bg border border-clay-border">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full accent-accent-base h-2 bg-input-bg rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] font-medium text-text-dimmer leading-relaxed mt-0.5">
            Adjust the tint overlay over your background image. Lower opacity reveals more of the image!
          </p>
        </div>
      </div>
    ) : null
  )

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
        style={{
          background: "var(--clay-bg)",
          border: "1.5px solid var(--clay-border)",
          boxShadow: "var(--clay-shadow)",
        }}
        title="Theme Settings"
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-accent-base" />
        ) : (
          <Moon className="h-5 w-5 text-accent-base" />
        )}
      </button>

      {mounted && createPortal(dropdown, document.body)}
    </div>
  )
}
