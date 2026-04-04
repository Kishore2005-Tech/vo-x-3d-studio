// horizontal-gallery.tsx
"use client"

import { useScrollStore, SCROLL_SECTIONS } from "@/lib/scroll-store"
import { useRef, useEffect } from "react"

function easeInOutQuart(x: number): number {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2
}

const IMAGES = [
  { url: "/images/img-gallery1.jpg" },
  { url: "/images/img-gallery2.jpg" },
  { url: "/images/img-gallery4.jpg" },
  { url: "/images/img-gallery5.jpg" },
  { url: "/images/img-gallery6.jpg" },
  { url: "/images/img-gallery7.jpg" },
  { url: "/images/img-gallery8.jpg" },
  { url: "/images/img-gallery9.jpg" },
  { url: "/images/img-gallery10.jpg" },
]

export function HorizontalGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = useScrollStore.subscribe((state) => {
      const progress = state.progress
      const section = SCROLL_SECTIONS.gallery as { start: number; end: number }

      const entryRange = 0.03
      const startSeeing = section.start - entryRange
      let verticalTransform = 100

      if (progress >= startSeeing && progress < section.start) {
        const p = (progress - startSeeing) / entryRange
        verticalTransform = 100 - easeInOutQuart(p) * 100
      } else if (progress >= section.start && progress <= section.end) {
        const p = (progress - section.start) / (section.end - section.start)
        if (p >= 0.85) {
          const exitP = (p - 0.85) / 0.15
          verticalTransform = -(easeInOutQuart(Math.min(1, exitP)) * 100)
        } else {
          verticalTransform = 0
        }
      } else if (progress > section.end) {
        verticalTransform = -100
      }

      let horizontalProgress = 0
      if (progress >= section.start && progress <= section.end) {
        const p = (progress - section.start) / (section.end - section.start)
        if (p > 0.1 && p <= 0.85) {
          horizontalProgress = (p - 0.1) / 0.75
        } else if (p > 0.85) {
          horizontalProgress = 1
        }
      }

      if (containerRef.current) {
        const isVisible = verticalTransform > -100 && verticalTransform < 100
        containerRef.current.style.display = isVisible ? "flex" : "none"
        if (isVisible) {
          containerRef.current.style.transform = `translate3d(0, ${verticalTransform}%, 0)`
        }
      }

      if (sliderRef.current) {
        sliderRef.current.style.transform = `translate3d(calc(-${horizontalProgress * 100}% + ${horizontalProgress * 100}vw), 0, 0)`
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden h-screen w-screen">
      <div
        ref={containerRef}
        className="absolute inset-0 flex-col will-change-transform h-full w-full hidden"
        style={{ background: "radial-gradient(circle at center, #111 0%, #050505 100%)" }}
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex-1 flex items-center pointer-events-auto overflow-hidden">
            <div
              ref={sliderRef}
              className="flex items-center pl-10 pr-10 lg:pl-24 lg:pr-24 will-change-transform w-max"
            >
              {IMAGES.map((img, i) => {
                const masonryClass = "w-[60vw] lg:w-[45vw] aspect-[16/9]"
                const marginClass = i === IMAGES.length - 1 ? "" : "mr-8 lg:mr-16"

                return (
                  <div
                    key={i}
                    className={`relative group shrink-0 overflow-hidden bg-white/[0.02] border border-white/5 ${marginClass} ${masonryClass}`}
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[1500ms] ease-out"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}