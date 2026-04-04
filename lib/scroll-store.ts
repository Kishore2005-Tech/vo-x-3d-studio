// scroll-store.ts

"use client"

import { create } from "zustand"

export type HardwareFinish = "black" | "gold" | "silver"
export type CustomFocus = "chassis" | "hardware" | "vinyl" | null
export type ActiveCustomizer = "turntable" | "mixer"


const SECTION_CONFIG = [
  { id: "hero", weight: 2.5, gap: 0.2 },
  { id: "tt_intro", weight: 2.5, gap: 0.2 },
  { id: "tt_angle_1", weight: 2.5, gap: 0.2 },
  { id: "tt_angle_2", weight: 2.5, gap: 0.2 },
  { id: "tt_detail", weight: 2.5, gap: 0.2 },
  { id: "tt_brand_focus", weight: 4, gap: 0.2 },
  { id: "exploded", weight: 4.5, gap: 0.2 },
  { id: "bento", weight: 3.5, gap: 0.2 },
  { id: "mx_intro", weight: 2.5, gap: 0.2 },
  { id: "mx_features", weight: 2.5, gap: 0.2 },
  { id: "mx_detail", weight: 2.5, gap: 0.2 },
  { id: "mx_exploded", weight: 4.5, gap: 0.2 },
  { id: "customize", weight: 5.0, gap: 0.0 },
  { id: "philosophy", weight: 5.0, gap: 0.0 },
  { id: "showroom", weight: 5.0, gap: 0.0 },
  { id: "gallery", weight: 7.0, gap: 0 },

  // setup_hold zerei para tentar ser insignificante e ir direto mais rápido para setup_reveal
  // { id: "setup_hold", weight: 2.5, gap: 0.1 },
  { id: "setup_hold", weight: 0, gap: 0 },

  { id: "setup_reveal", weight: 5.0, gap: 0.1 },
  { id: "outro", weight: 3.0, gap: 0.1 },
]

function generateRelativeSections(config: typeof SECTION_CONFIG) {
  const totalUnits = config.reduce((acc, curr) => acc + curr.weight + curr.gap, 0)
  let currentUnit = 0
  const sections: any = {}
  config.forEach((section) => {
    const start = currentUnit / totalUnits
    const end = (currentUnit + section.weight) / totalUnits
    sections[section.id] = { start, end }
    currentUnit += section.weight + section.gap
  })
  return sections
}

export const SCROLL_SECTIONS = generateRelativeSections(SECTION_CONFIG)

export const SECTION_COLORSaa: Record<string, string> = {
  hero: "#0a0a0a", tt_intro: "#050505", tt_angle_1: "#050505", tt_angle_2: "#050505",
  tt_detail: "#050505", tt_brand_focus: "#F2F2F2",
  exploded: "#050505", bento: "#050505", mx_intro: "#050505", mx_features: "#050505",
  mx_detail: "#050505", mx_exploded: "#050505", customize: "#E8E8E8", showroom: "#ffffff",
  gallery: "#050505", setup_reveal: "#050505", outro: "#050505", neutral: "#050505", setup_hold: "#050505",
}


export const SECTION_COLORS: Record<string, string> = {
  hero: "#0a0a0a", tt_intro: "#050505", tt_angle_1: "#050505", tt_angle_2: "#050505",
  tt_detail: "#050505", tt_brand_focus: "#F2F2F2",
  exploded: "#050505", bento: "#050505", mx_intro: "#050505", mx_features: "#050505",
  mx_detail: "#050505", mx_exploded: "#050505", philosophy: "#e8e8e8",
  customize: "#E8E8E8",
  showroom: "#0A0A0A",
  gallery: "#050505", setup_reveal: "#050505", outro: "#050505", neutral: "#050505", setup_hold: "#050505",
}

interface ScrollState {
  progress: number
  // Turntable
  chassisColor: string
  hardwareFinish: HardwareFinish
  vinylColor: string
  customFocus: CustomFocus
  // Mixer
  mixerColor: string
  showGlossyTop: boolean
  showFaceplate: boolean
  activeCustomizer: ActiveCustomizer

  // Actions
  setChassisColor: (color: string) => void
  setHardwareFinish: (finish: HardwareFinish) => void
  setVinylColor: (color: string) => void
  setCustomFocus: (focus: CustomFocus) => void
  setProgress: (progress: number) => void
  setMixerColor: (color: string) => void
  toggleGlossyTop: () => void
  toggleFaceplate: () => void
  setActiveCustomizer: (tab: ActiveCustomizer) => void
}

export const CHASSIS_COLORS = [
  { name: "Midnight Black", color: "#1a1a1a" }, { name: "Gunmetal", color: "#2c3539" },
  { name: "Silver", color: "#c0c0c0" }, { name: "Rose Gold", color: "#b76e79" },
  { name: "Navy Blue", color: "#1c2951" }, { name: "Racing Red", color: "#c0392b" },
  { name: "Forest Green", color: "#228b22" }, { name: "Copper Bronze", color: "#b87333" },
  { name: "Arctic White", color: "#f0f0f0" },
]

export const HARDWARE_FINISHES: { name: string; value: HardwareFinish; color: string }[] = [
  { name: "Black Chrome", value: "black", color: "#1a1a1a" },
  { name: "Golden", value: "gold", color: "#D4AF37" },
  { name: "Silver Chrome", value: "silver", color: "#C0C0C0" },
]

export const VINYL_COLORS = [
  { name: "Black", color: "#050505" }, { name: "Green", color: "#1B5E20" },
  { name: "Red", color: "#B71C1C" }, { name: "Blue", color: "#0D47A1" },
  { name: "Yellow", color: "#F9A825" }, { name: "Orange", color: "#E65100" },
  { name: "White", color: "#E8E8E8" }, { name: "Purple", color: "#4A148C" },
  { name: "Pink", color: "#C2185B" },
]

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  chassisColor: "#1a1a1a", hardwareFinish: "black", vinylColor: "#050505", customFocus: null,
  mixerColor: "#1a1a1a", showGlossyTop: true, showFaceplate: true, activeCustomizer: "turntable",

  setChassisColor: (color) => set({ chassisColor: color, customFocus: "chassis" }),
  setHardwareFinish: (finish) => set({ hardwareFinish: finish, customFocus: "hardware" }),
  setVinylColor: (color) => set({ vinylColor: color, customFocus: "vinyl" }),
  setCustomFocus: (focus) => set({ customFocus: focus }),
  setProgress: (progress) => set({ progress }),
  setMixerColor: (color) => set({ mixerColor: color }),
  toggleGlossyTop: () => set((state) => ({ showGlossyTop: !state.showGlossyTop })),
  toggleFaceplate: () => set((state) => ({ showFaceplate: !state.showFaceplate })),
  setActiveCustomizer: (tab) => set({ activeCustomizer: tab, customFocus: null }),
}))

export function getCurrentSection(progress: number): string {
  for (const [id, range] of Object.entries(SCROLL_SECTIONS as any)) {
    const r = range as { start: number, end: number }
    if (progress >= r.start && progress <= r.end) return id
  }
  return "neutral"
}

export function getSectionProgress(progress: number, sectionId: string): number {
  const section = SCROLL_SECTIONS[sectionId as keyof typeof SCROLL_SECTIONS] as { start: number; end: number } | undefined
  if (!section) return 0
  if (progress < section.start) return 0
  if (progress > section.end) return 1
  return (progress - section.start) / (section.end - section.start)
}
