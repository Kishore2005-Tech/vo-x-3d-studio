// bullet-point-overlay.tsx

"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useScrollStore, SCROLL_SECTIONS, getCurrentSection } from "@/lib/scroll-store"

interface BulletPoint {
  id: string
  label: string
  description: string
  x: string
  y: string
  side: "left" | "right"
}

// BULLETS DO TOCA-DISCOS
const TT_BULLETS: BulletPoint[] = [
  { id: "chassis", label: "Vibration Isolation", description: "Multi-layered chassis built to eliminate unwanted interference.", x: "18%", y: "25%", side: "right" },
  { id: "platter", label: "Aluminum Platter", description: "2.8kg of precision-balanced mass for perfect rotational stability.", x: "14%", y: "45%", side: "right" },
  { id: "motor", label: "Direct-Drive Motor", description: "Instantaneous torque with quartz-locked precision speed.", x: "18%", y: "65%", side: "right" },
  { id: "tonearm", label: "S-Shaped Tonearm", description: "Designed with carbon fiber for surgical tracking and zero resonance.", x: "82%", y: "30%", side: "left" },
  { id: "cartridge", label: "Ortofon VNL", description: "The professional standard for high-fidelity vinyl playback.", x: "84%", y: "50%", side: "left" },
  { id: "pitch", label: "Pitch Control", description: "Ultra-fine digital adjustment for perfect beatmatching.", x: "82%", y: "70%", side: "left" }
]

// BULLETS DO MIXER
const MX_BULLETS: BulletPoint[] = [
  { id: "audio", label: "24-bit Audio Interface", description: "Studio-grade DACs for crystal clear club sound.", x: "18%", y: "25%", side: "right" },
  { id: "fader", label: "Premium Crossfader", description: "Magnetic tension for scratching precision and longevity.", x: "14%", y: "45%", side: "right" },
  { id: "io", label: "XLR & RCA I/O", description: "Professional connectivity with gold-plated terminals.", x: "18%", y: "65%", side: "right" },
  { id: "pads", label: "16 RGB Performance Pads", description: "Tactile rubber pads for Hot Cues, Rolls, and Sampler.", x: "82%", y: "30%", side: "left" },
  { id: "fx", label: "Beat FX Engine", description: "Hardware-based effects synced instantly to the BPM.", x: "84%", y: "50%", side: "left" },
  { id: "eq", label: "Isolator EQs", description: "3-band EQ with total kill switches for precise mixing.", x: "82%", y: "70%", side: "left" }
]

export function BulletPointsOverlay() {
  const progress = useScrollStore((s) => s.progress)
  const currentSection = getCurrentSection(progress)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const isActiveTT = currentSection === "exploded"
  const isActiveMX = currentSection === "mx_exploded"
  const isActive = isActiveTT || isActiveMX

  // Identifica a seção ativa para pegar a configuração de inicio/fim
  const sectionConfig = isActiveTT
    ? SCROLL_SECTIONS.exploded as { start: number; end: number }
    : SCROLL_SECTIONS.mx_exploded as { start: number; end: number }

  const isVisible = useMemo(() => {
    if (!isActive || !sectionConfig) return false
    const sectionProgress = (progress - sectionConfig.start) / (sectionConfig.end - sectionConfig.start)
    return sectionProgress > 0.25 && sectionProgress < 0.92
  }, [progress, isActive, sectionConfig])

  if (!isVisible) return null

  // Escolhe qual array de bullets usar
  const bulletsToRender = isActiveTT ? TT_BULLETS : MX_BULLETS

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {bulletsToRender.map((point) => (
        <AppleMarker
          key={point.id}
          point={point}
          isHovered={hoveredId === point.id}
          onHover={() => setHoveredId(point.id)}
          onLeave={() => setHoveredId(null)}
        />
      ))}
    </div>
  )
}

function AppleMarker({ point, isHovered, onHover, onLeave }: {
  point: BulletPoint
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ left: point.x, top: point.y }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <motion.div
        initial={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
        animate={{ scale: isHovered ? 1.2 : 1, backgroundColor: isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.15)" }}
        className="w-6 h-6 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer transition-colors"
      >
        <motion.div
          initial={{ color: "#ffffff" }}
          animate={{ rotate: isHovered ? 90 : 0, color: isHovered ? "#000000" : "#ffffff" }}
          className="text-[18px] font-light leading-none"
        >
          +
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`absolute top-1/2 h-[0.5px] bg-white/40 ${point.side === 'right' ? 'left-full ml-2' : 'right-full mr-2'}`}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -40, scale: 1, x: point.side === 'right' ? 90 : -330 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute w-[240px] z-50"
          >
            <div className="relative p-6 rounded-[28px] backdrop-blur-3xl bg-white/[0.03] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <h3 className="text-[15px] font-semibold text-white tracking-tight mb-2">{point.label}</h3>
              <p className="text-[13px] text-white/50 leading-snug font-normal text-pretty">{point.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}