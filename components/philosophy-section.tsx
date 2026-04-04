// philosophy-section.tsx

"use client"

import { useMemo } from "react"
import { useScrollStore, SCROLL_SECTIONS } from "@/lib/scroll-store"
import { useThemeGalleryStore, THEMES } from "./theme-gallery-section"

function lerpColor(color1: string, color2: string, t: number): string {
  const hex2rgb = (hex: string) => {
    const h = hex.replace("#", "")
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    }
  }
  const c1 = hex2rgb(color1)
  const c2 = hex2rgb(color2)
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  return `rgb(${r},${g},${b})`
}

export function PhilosophySection() {
  const progress = useScrollStore((s) => s.progress)
  const activeThemeId = useThemeGalleryStore((s) => s.activeThemeId)
  const section = SCROLL_SECTIONS.philosophy as { start: number; end: number }
  const showroom = SCROLL_SECTIONS.showroom as { start: number; end: number }

  const activeTheme = useMemo(() => THEMES.find(t => t.id === activeThemeId) || THEMES[0], [activeThemeId])
  const themeBgColor = activeTheme.chassisColor

  const { block1Y, block2Y, bgColor, isVisible } = useMemo(() => {

    const extendedStart = section.start - 0.04
    if (progress < extendedStart || progress > showroom.start + 0.05) {
      return { block1Y: 100, block2Y: 100, bgColor: "#E8E8E8", isVisible: false }
    }

    const localP = Math.max(0, Math.min(1, (progress - section.start) / (section.end - section.start)))

    let colorT = 0
    if (localP > 0.3) {
      colorT = Math.min(1, (localP - 0.3) / 0.6)
    }
    const bgColor = lerpColor("#E8E8E8", themeBgColor, colorT)

    const block1Y = (0.25 - localP) * 250
    const block2Y = (0.65 - localP) * 250

    return { block1Y, block2Y, bgColor, isVisible: true }
  }, [progress, section, showroom, themeBgColor])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-[5] pointer-events-none overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* BLOCO 1 */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 will-change-transform"
        style={{ transform: `translate3d(0, ${block1Y}vh, 0)` }}
      >
        <h2 className="text-6xl md:text-8xl lg:text-[120px] font-inter font-black tracking-tighter text-[#111111] leading-[0.9] uppercase text-center max-w-7xl">
          Welcome to the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#666666]">
            Neighborhood.
          </span>
        </h2>
      </div>

      {/* BLOCO 2 */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 will-change-transform"
        style={{ transform: `translate3d(0, ${block2Y}vh, 0)` }}
      >
        <p className="text-3xl md:text-4xl lg:text-6xl font-inter font-bold tracking-tight text-white/80 leading-[1.05] uppercase text-center max-w-5xl">
          Where pure analog heritage meets the future<br /> of creative expression.
          <span className="block mt-4 text-white font-bold">No distractions, <br />just the sound.</span>
        </p>
      </div>
    </div>
  )
}
