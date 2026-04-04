// blackout-overlay.tsx

"use client"

import { useEffect, useRef } from "react"
import { useScrollStore, SCROLL_SECTIONS, getSectionProgress } from "@/lib/scroll-store"

export function BlackoutOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = useScrollStore.subscribe((state) => {
      const progress = state.progress

      const p_gallery = getSectionProgress(progress, "gallery")
      const p_outro = getSectionProgress(progress, "outro")

      let opacity = 0

      if (progress >= SCROLL_SECTIONS.gallery.start && progress <= SCROLL_SECTIONS.gallery.end) {

        if (p_gallery >= 0.75 && p_gallery <= 0.85) {
          opacity = (p_gallery - 0.75) / 0.10 // Vai de 0 a 1
        } else if (p_gallery > 0.85) {
          opacity = 1
        }
      }

      else if (progress > SCROLL_SECTIONS.gallery.end && progress <= SCROLL_SECTIONS.setup_reveal.end) {
        opacity = 1
      }

      else if (progress > SCROLL_SECTIONS.setup_reveal.end && progress <= SCROLL_SECTIONS.outro.end) {
        if (p_outro < 0.3) {
          opacity = 1 - (p_outro / 0.3) // Vai de 1 a 0
        } else {
          opacity = 0
        }
      }

      if (overlayRef.current) {
        overlayRef.current.style.display = opacity > 0.001 ? "block" : "none"
        overlayRef.current.style.opacity = opacity.toString()
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[35] pointer-events-none will-change-[opacity]"
      style={{ display: 'none', opacity: 0, backgroundColor: '#050505' }}
    />
  )
}