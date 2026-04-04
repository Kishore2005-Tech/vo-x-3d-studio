"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useScrollStore, getCurrentSection } from "@/lib/scroll-store"

export function DragRing() {
  const progress = useScrollStore((s) => s.progress)
  const currentSection = getCurrentSection(progress)

  const isVisible = currentSection === "exploded" || currentSection === "mx_exploded"

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-[5%] left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-0"
        >
          <div className="relative w-[500px] h-[80px]">
            <svg
              viewBox="0 0 400 100"
              className="w-full h-full overflow-visible"
              style={{ shapeRendering: "geometricPrecision" }}
            >
              <path
                d="M 50 35 Q 200 90 350 35"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M 60 30 L 50 35 L 55 46"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 90 60 Q 200 95 310 60"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeOpacity="0.15"
                strokeDasharray="4 6"
              />
              <path
                d="M 340 30 L 350 35 L 345 46"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span className="text-[9px] font-normal uppercase tracking-[0.1em] text-white/50">
            Drag to Rotate
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}