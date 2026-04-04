// bento-cards.tsx

"use client"

import { useScrollStore, SCROLL_SECTIONS } from "@/lib/scroll-store"
import { useMemo } from "react"

function easeInOutQuart(x: number): number {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2
}

type CardType = "stat" | "quote" | "image"

interface BentoCard {
  type: CardType
  title?: string
  stat?: string
  statUnit?: string
  description?: string
  quote?: string
  imageSrc?: string
  colSpan: string
  rowSpan: string
  theme: "light" | "dark"
}


const BENTO_CARDS: BentoCard[] = [
  {
    type: "image",
    title: "DJ TUCA OCULTO - #1 BEST HIP-HOP DJ",
    stat: "16",
    statUnit: "RGB",
    description: "Tactile rubber pads for Hot Cues and Sampler control.",
    imageSrc: "/images/img-gallery3.jpg",
    colSpan: "lg:col-span-2",
    rowSpan: "lg:row-span-2",
    theme: "dark"
  },

  {
    type: "stat",
    title: "Precision Pitch",
    stat: "±8",
    statUnit: "%",
    description: "Ultra-fine digital adjustment for perfect beatmatching.",
    colSpan: "lg:col-span-1",
    rowSpan: "lg:row-span-1",
    theme: "dark"
  },

  {
    type: "stat",
    title: "High Torque Motor",
    stat: "3.3",
    statUnit: "kgf·cm",
    description: "Instant start with precision.",
    colSpan: "lg:col-span-1",
    rowSpan: "lg:row-span-1",
    theme: "dark"
  },

  {
    type: "quote",
    quote: "Engineered for artists who demand sonic perfection in every set.",
    colSpan: "lg:col-span-2",
    rowSpan: "lg:row-span-1",
    theme: "dark"
  },

  {
    type: "stat",
    title: "Audio Interface",
    stat: "96",
    statUnit: "kHz",
    description: "Studio-grade DACs for flawless signal.",
    colSpan: "lg:col-span-1",
    rowSpan: "lg:row-span-1",
    theme: "dark"
  },

  {
    type: "stat",
    title: "Cartridge",
    stat: "VNL",
    statUnit: "Ortofon",
    description: "Pre-installed pro tracking.",
    colSpan: "lg:col-span-1",
    rowSpan: "lg:row-span-1",
    theme: "dark"
  },

  {
    type: "image",
    title: "S-Shaped Tonearm",
    stat: "Carbon",
    statUnit: "Fiber",
    description: "Zero resonance surgical tracking.",
    imageSrc: "/images/img13.jpg",
    colSpan: "lg:col-span-2",
    rowSpan: "lg:row-span-1",
    theme: "dark"
  },
]

export function BentoCards() {
  const progress = useScrollStore((s) => s.progress)
  const section = SCROLL_SECTIONS.bento as { start: number; end: number }

  const slideTransform = useMemo(() => {
    const entryStart = section.start - 0.02; const entryEnd = section.start + 0.02;
    const exitStart = section.end - 0.03; const exitEnd = section.end + 0.01;
    if (progress < entryStart) return 100
    if (progress >= entryStart && progress < entryEnd) return 100 - easeInOutQuart((progress - entryStart) / (entryEnd - entryStart)) * 100
    if (progress >= entryEnd && progress < exitStart) return 0
    if (progress >= exitStart && progress < exitEnd) return -(easeInOutQuart((progress - exitStart) / (exitEnd - exitStart)) * 100)
    return -100
  }, [progress, section.start, section.end])

  if (slideTransform <= -100 || slideTransform >= 100) return null

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center will-change-transform" style={{ transform: `translate3d(0, ${slideTransform}%, 0)` }}>
        <div className="absolute h-[1000px] inset-0 z-0" style={{ background: "radial-gradient(ellipse at center, #111 0%, #050505 100%)" }} />

        <div className="relative z-10 w-full h-full flex items-center justify-center p-6 lg:p-12 pb-10 lg:pb-16">
          <div className="w-full h-full max-w-[1600px] max-h-[1250px] flex flex-col justify-center">


            <div className="mb-8 shrink-0">
              <h2 className="text-5xl lg:text-7xl font-inter font-medium text-white tracking-tighter leading-[0.95]">
                <br />
                <span className="bg-gradient-to-br from-[#ffffff] via-[#c0c0c0] to-[#131111] bg-clip-text text-transparent"> </span>
              </h2>
            </div>

            {/* GRID DO BENTO */}
            <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-3 gap-4 w-full h-full  pointer-events-auto">

              {BENTO_CARDS.map((card, index) => {
                const isLight = card.theme === "light"
                const themeClasses = isLight
                  ? "bg-[#F4F4F4] text-[#111111] shadow-xl"
                  : "bg-[#0f0f0f] text-white border border-white/5 shadow-2xl"

                return (
                  <div key={index} className={`group rounded-[24px] overflow-hidden relative flex flex-col transition-transform duration-500 hover:scale-[1.02] ${card.colSpan} ${card.rowSpan} ${themeClasses}`}>

                    {/* SE FOR CARD DE IMAGEM */}
                    {card.type === "image" && card.imageSrc && (
                      <>
                        <img
                          src={card.imageSrc}
                          alt={card.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Overlay Gradiente para garantir leitura do texto */}
                        <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-t from-[#F4F4F4] via-[#F4F4F4]/80 to-transparent' : 'bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/90 to-transparent'}`} />
                      </>
                    )}

                    {/* CONTEÚDO: FRASE (QUOTE) */}
                    {card.type === "quote" && (
                      <div className="relative z-10 p-8 lg:p-10 flex items-center h-full">
                        <h3 className="text-3xl lg:text-[40px] font-inter font-medium tracking-tight leading-[1.1]">
                          {card.quote}
                        </h3>
                      </div>
                    )}

                    {/* CONTEÚDO: STATS OU IMAGEM (Textos) */}
                    {(card.type === "stat" || card.type === "image") && (
                      <div className="relative z-10 p-6 lg:p-8 flex flex-col h-full justify-between">
                        <span className={`text-[10px] lg:text-[11px] uppercase tracking-[0.2em] font-bold ${isLight ? "text-black/70" : "text-white/20"}`}>
                          {card.title}
                        </span>

                        <div className="mt-auto">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">

                            <h3 className="text-6xl lg:text-[80px] font-inter font-bold tracking-tighter leading-none">
                              {card.stat}
                            </h3>
                            {card.statUnit && (
                              <span className={`text-lg lg:text-2xl font-medium tracking-tight ${isLight ? "text-black/60" : "text-white/50"}`}>
                                {card.statUnit}
                              </span>
                            )}
                          </div>
                          <p className={`text-[13px] font-medium leading-relaxed max-w-[85%] ${isLight ? "text-black/60" : "text-white/40"}`}>
                            {card.description}
                          </p>
                        </div>
                      </div>
                    )}

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
