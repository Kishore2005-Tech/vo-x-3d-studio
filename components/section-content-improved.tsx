// section-content-improved.tsx

"use client"

import { useScrollStore, SCROLL_SECTIONS, getCurrentSection, getSectionProgress } from "@/lib/scroll-store"
import { useMemo } from "react"

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

interface SectionInfo {
  title: string
  highlight?: string
  subtitle: string
  description: string
  featureLabels?: string[]
  features?: string[]
}

const SECTIONS_DATA: Record<string, SectionInfo> = {
  tt_intro: {
    title: "Crafted with\n",
    highlight: "perfection",
    subtitle: "",
    description: "From the direct-drive motor to the carbon tonearm, every component is precision engineered for the uncompromising DJ.",
  },
  tt_angle_1: {
    title: "Solid design\n",
    highlight: "foundation",
    subtitle: "",
    description: "High-density die-cast aluminum chassis engineered to eliminate unwanted vibrations and deliver pure sound.",
  },
  tt_angle_2: {
    title: "The master\n",
    highlight: "precision",
    subtitle: "",
    description: "S-shaped tonearm with adjustable VTA and gold-plated gimbal mechanism for surgical tracking accuracy.",
  },
  tt_detail: {
    title: "Tonearm\n",
    highlight: "engineering",
    subtitle: "",
    description: "Gold-finished gimbal mechanism with adjustable VTA, anti-skating, and pre-mounted Ortofon VNL cartridge.",
  },
  mx_intro: {
    title: "Command the\n",
    highlight: "best mixer",
    subtitle: "",
    description: "Two-channel mixer built for the creative DJ. Intuitive layout, studio-grade audio processing, zero compromise.",
  },
  mx_features: {
    title: "Performance\n",
    highlight: "controls",
    subtitle: "",
    description: "Precision faders, RGB performance pads, and built-in FX processing for seamless creative expression.",
    featureLabels: ["Channels", "Pads", "FX", "Faders", "Audio"],
    features: ["2-channel + AUX", "16 RGB Pads", "Beat FX Engine", "Pro Faders", "24-bit Audio"],
  },
  mx_detail: {
    title: "Studio\n",
    highlight: "connectivity",
    subtitle: "",
    description: "XLR master outputs, USB audio interface, dual phono/line inputs with grounding. Ready for club or studio.",
  },
  setup_reveal: {
    title: "The ultimate\n",
    highlight: "setup",
    subtitle: "",
    description: "Two V0X3D turntables flanking the mixer. The complete DJ ecosystem, designed to work in perfect harmony.",
  },
  outro: {
    title: "Sound\n",
    highlight: "system",
    subtitle: "",
    description: "Where engineering meets artistry. The definitive instrument for the modern performer.",
  },
  exploded: {
    title: "Sound\n",
    highlight: "system",
    subtitle: "",
    description: "Where engineering meets artistry. The definitive instrument for the modern performer.",
  },
}

const HIDDEN_SECTIONS = new Set(["neutral", "hero", "bento", "tt_brand_focus", "tt_features", "gallery", "customize", "showroom", "mx_exploded", "exploded", "outro", "setup_reveal", "setup_hold"])

export function SectionContentImproved() {
  const progress = useScrollStore((s) => s.progress)
  const currentSection = getCurrentSection(progress)
  const sectionData = SECTIONS_DATA[currentSection]
  const sectionProgress = getSectionProgress(progress, currentSection)

  const { opacity, scale } = useMemo(() => {
    if (!sectionData || HIDDEN_SECTIONS.has(currentSection)) return { opacity: 0, scale: 0.97 }

    const fadeInStart = currentSection === "tt_intro" ? 0.20 : 0.15
    const fadeInEnd = currentSection === "tt_intro" ? 0.40 : 0.35
    const fadeOutStart = 0.75
    const fadeOutEnd = 0.90
    let op = 0

    if (sectionProgress >= fadeInStart && sectionProgress <= fadeInEnd) {
      op = easeInOutCubic((sectionProgress - fadeInStart) / (fadeInEnd - fadeInStart))
    } else if (sectionProgress > fadeInEnd && sectionProgress <= fadeOutStart) {
      op = 1
    } else if (sectionProgress > fadeOutStart && sectionProgress <= fadeOutEnd) {
      op = 1 - easeInOutCubic((sectionProgress - fadeOutStart) / (fadeOutEnd - fadeOutStart))
    }

    const scaleProgress = sectionProgress < fadeInEnd ? easeInOutCubic(Math.min(1, (sectionProgress - fadeInStart) / (fadeInEnd - fadeInStart))) : 1
    const sc = 0.97 + (0.03 * scaleProgress)
    return { opacity: Math.max(0, op), scale: sc }
  }, [sectionProgress, sectionData, currentSection])

  if (!sectionData || opacity <= 0.01 || HIDDEN_SECTIONS.has(currentSection)) return null

  const isRightSide = ["mx_features", "mx_detail", "mx_exploded", "outro", "exploded"].includes(currentSection)
  const hasFeatures = sectionData.features && sectionData.featureLabels

  const renderTitle = (title: string, highlight?: string) => {
    if (!highlight) return title
    const parts = title.split(highlight)
    return (
      <>
        {parts[0]}
        <span className="bg-gradient-to-br from-[#ffffff] via-[#bbbbbb] to-[#ffffff] bg-clip-text text-transparent">
          {highlight}
        </span>
        {parts[1]}
      </>
    )
  }

  return (
    <>

      <div className="fixed inset-0 z-30 pointer-events-none flex items-center" style={{ opacity }}>
        <div
          className={`w-full max-w-6xl px-12 lg:px-24 flex ${isRightSide ? "justify-end ml-auto" : "justify-start"}`}
          style={{ transform: `scale(${scale})`, transformOrigin: isRightSide ? "right center" : "left center" }}
        >
          <div className={`max-w-lg ${isRightSide ? "text-right" : "text-left"}`}>
            <p className="text-[12px] uppercase tracking-[0.5em] text-white/40 font-bold mb-6 italic">
              {sectionData.subtitle}
            </p>

            <h1 className="text-7xl font-inter lg:text-8xl font-medium text-white mb-8 tracking-tighter leading-[0.85]">
              {renderTitle(sectionData.title, sectionData.highlight)}
            </h1>

            <p className="text-lg lg:text-xl text-white/50 mb-12 leading-relaxed font-light" style={{ marginLeft: isRightSide ? "auto" : "0" }}>
              {sectionData.description}
            </p>
          </div>
        </div>
      </div>

      {hasFeatures && (
        <div className="fixed left-12 lg:left-24 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col gap-3">
          {sectionData.features!.map((feat, i) => {
            const cardOpacity = Math.max(0, opacity - (i * 0.15))
            const cardScale = 0.95 + (0.05 * (cardOpacity > 0 ? 1 : 0))

            return (
              <div
                key={i}
                className="w-48 p-4 rounded-xl backdrop-blur-xl bg-white/[0.03] border border-white/10 shadow-2xl"
                style={{
                  opacity: cardOpacity > 0 ? 1 : 0,
                  transform: `scale(${cardScale})`,
                  transformOrigin: "left center",
                  transition: "opacity 0.4s ease-out, transform 0.4s ease-out"
                }}
              >
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#cccccc]/70 mb-1 font-semibold">
                  {sectionData.featureLabels![i]}
                </p>
                <p className="text-sm text-white/90 font-medium">
                  {feat}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
