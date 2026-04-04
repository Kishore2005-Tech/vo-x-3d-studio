// theme-gallery-section.tsx

"use client"

import React, { useMemo, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useScrollStore, SCROLL_SECTIONS } from "@/lib/scroll-store"
import { create } from "zustand"
import { ContactShadows, Environment, Lightformer, useTexture } from "@react-three/drei"


// ==========================================
// ESTADO GLOBAL DA GALERIA
// ==========================================
interface ThemeGalleryState {
  activeThemeId: string
  setActiveThemeId: (id: string) => void
}

export const useThemeGalleryStore = create<ThemeGalleryState>((set) => ({
  activeThemeId: "executive",
  setActiveThemeId: (id) => set({ activeThemeId: id }),
}))


const P_GOLD = Array(16).fill("#D4AF37")
const P_SILVER = Array(16).fill("#C0C0C0")
const P_BLACK = Array(16).fill("#1A1A1A")
const P_WHITE = Array(16).fill("#F8F9FA")
const P_CRIMSON = Array(16).fill("#990000")
const P_ELECTRIC = ["#00FFFF", "#7B2CBF", "#00FFFF", "#7B2CBF", "#00FFFF", "#7B2CBF", "#00FFFF", "#7B2CBF", "#00FFFF", "#7B2CBF", "#00FFFF", "#7B2CBF", "#00FFFF", "#7B2CBF", "#00FFFF", "#7B2CBF"]
const P_ICE = Array(16).fill("#A2D2FF")
const P_MINT = Array(16).fill("#B7E4C7")
const P_DESERT = Array(16).fill("#D4A373")
const P_VOLCANIC = ["#FF4D00", "#333333", "#FF4D00", "#333333", "#FF4D00", "#333333", "#FF4D00", "#333333", "#FF4D00", "#333333", "#FF4D00", "#333333", "#FF4D00", "#333333", "#FF4D00", "#333333"]

// ==========================================
// BANCO DE DADOS DOS TEMAS
// ==========================================
const THEMES = [
  { id: "sovereign-navy", name: "SOVEREIGN NAVY", subtitle: "Yacht Club Edition", chassisColor: "#0A192F", hardwareFinish: "gold" as const, vinylColor: "#E0E1DD", pads: P_GOLD, glossy: true },
  // { id: "noir-reserve", name: "NOIR RESERVE", subtitle: "Private Lounge", chassisColor: "#050505", hardwareFinish: "silver" as const, vinylColor: "#1A1A1A", pads: P_CRIMSON, glossy: true },
  { id: "british-racing", name: "RACING GREEN", subtitle: "Heritage Series", chassisColor: "#004225", hardwareFinish: "gold" as const, vinylColor: "#F5F5F0", pads: P_GOLD, glossy: true },
  { id: "oxblood-luxe", name: "OXBLOOD RED", subtitle: "Connoisseur Choice", chassisColor: "#4A0E0E", hardwareFinish: "gold" as const, vinylColor: "#111111", pads: P_GOLD, glossy: true },
  // { id: "royal-amethyst", name: "ROYAL PURPLE", subtitle: "Majestic Audio", chassisColor: "#2D033B", hardwareFinish: "gold" as const, vinylColor: "#111111", pads: P_GOLD, glossy: true },

  // { id: "phantom-white", name: "PHANTOM GHOST", subtitle: "Minimalist Protocol", chassisColor: "#F8F9FA", hardwareFinish: "silver" as const, vinylColor: "#FFFFFF", pads: P_WHITE, glossy: false },
  // { id: "stealth-matte", name: "STEALTH BLACK", subtitle: "Tactical Response", chassisColor: "#121212", hardwareFinish: "black" as const, vinylColor: "#1A1A1A", pads: P_BLACK, glossy: false },
  //  { id: "concrete-grey", name: "RAW CONCRETE", subtitle: "Brutalist Series", chassisColor: "#8E8E8E", hardwareFinish: "black" as const, vinylColor: "#CCCCCC", pads: P_BLACK, glossy: false },
  { id: "sage-modern", name: "MUTED SAGE", subtitle: "Organic Tech", chassisColor: "#7D8471", hardwareFinish: "silver" as const, vinylColor: "#F5F5F0", pads: P_MINT, glossy: false },
  { id: "sandstone-copper", name: "SANDSTONE", subtitle: "Earth Elements", chassisColor: "#C89464", hardwareFinish: "black" as const, vinylColor: "#E0D0B0", pads: P_DESERT, glossy: false },

  { id: "tokyo-night", name: "TOKYO NIGHT", subtitle: "Cyberpunk Protocol", chassisColor: "#120B21", hardwareFinish: "silver" as const, vinylColor: "#7B2CBF", pads: P_ELECTRIC, glossy: true },
  { id: "arctic-zero", name: "ARCTIC ZERO", subtitle: "Frozen Synthesis", chassisColor: "#CAF0F8", hardwareFinish: "silver" as const, vinylColor: "#00B4D8", pads: P_ICE, glossy: true },
  { id: "acid-ash", name: "ACID ASH", subtitle: "Street Culture", chassisColor: "#1A1A1A", hardwareFinish: "black" as const, vinylColor: "#CCFF00", pads: P_BLACK, glossy: true },
  // { id: "hyper-pink", name: "NEON MAGENTA", subtitle: "Retrowave Echo", chassisColor: "#2D033B", hardwareFinish: "silver" as const, vinylColor: "#FF007F", pads: P_ELECTRIC, glossy: true },
  { id: "glitch-blue", name: "GLITCH BLUE", subtitle: "Digital Signal", chassisColor: "#001219", hardwareFinish: "black" as const, vinylColor: "#00E5FF", pads: P_ICE, glossy: true },

  //  { id: "brushed-copper", name: "RAW COPPER", subtitle: "Forged Metal", chassisColor: "#B87333", hardwareFinish: "black" as const, vinylColor: "#2C2C2C", pads: P_BLACK, glossy: false },
  //  { id: "titanium-edge", name: "TITANIUM", subtitle: "Aerospace Grade", chassisColor: "#3A3D40", hardwareFinish: "silver" as const, vinylColor: "#555555", pads: P_SILVER, glossy: false },
  { id: "brass-heavy", name: "ANTIQUE BRASS", subtitle: "Industrial Heritage", chassisColor: "#91785D", hardwareFinish: "gold" as const, vinylColor: "#222222", pads: P_GOLD, glossy: false },
  // { id: "gunmetal-pro", name: "GUNMETAL", subtitle: "Precision Instrument", chassisColor: "#2A2E30", hardwareFinish: "black" as const, vinylColor: "#111111", pads: P_BLACK, glossy: false },
  { id: "hazard-orange", name: "HAZARD", subtitle: "Caution Series", chassisColor: "#111111", hardwareFinish: "black" as const, vinylColor: "#FF6B00", pads: P_VOLCANIC, glossy: false },

  { id: "monza-red", name: "MONZA RED", subtitle: "Supercar Edition", chassisColor: "#D00000", hardwareFinish: "black" as const, vinylColor: "#000000", pads: P_BLACK, glossy: true },
  { id: "electric-blue", name: "COBALT", subtitle: "Deep Sea Tech", chassisColor: "#003049", hardwareFinish: "silver" as const, vinylColor: "#0077B6", pads: P_ICE, glossy: true },
  { id: "mamba-yellow", name: "MAMBA", subtitle: "Venom Series", chassisColor: "#FFB703", hardwareFinish: "black" as const, vinylColor: "#000000", pads: P_BLACK, glossy: true },
  { id: "forest-velvet", name: "DEEP FOREST", subtitle: "Evergreen Audio", chassisColor: "#1B4332", hardwareFinish: "gold" as const, vinylColor: "#081C15", pads: P_GOLD, glossy: true },
  { id: "terracotta-sun", name: "TERRACOTTA", subtitle: "Desert Session", chassisColor: "#BC4749", hardwareFinish: "black" as const, vinylColor: "#6A994E", pads: P_MINT, glossy: false },

  { id: "marble-white", name: "CARRARA MARBLE", subtitle: "Sculpted Sound", chassisColor: "#E5E5E5", hardwareFinish: "gold" as const, vinylColor: "#FFFFFF", pads: P_WHITE, glossy: true },
  { id: "obsidian-gold", name: "OBSIDIAN GOLD", subtitle: "Midnight Sun", chassisColor: "#000000", hardwareFinish: "gold" as const, vinylColor: "#000000", pads: P_GOLD, glossy: true },
  { id: "ceramic-blue", name: "CERAMIC BLUE", subtitle: "Studio Craft", chassisColor: "#457B9D", hardwareFinish: "silver" as const, vinylColor: "#F1FAEE", pads: P_WHITE, glossy: false },
  // { id: "vulcan-ash", name: "VULCAN ASH", subtitle: "Magma Core", chassisColor: "#333333", hardwareFinish: "black" as const, vinylColor: "#FF4D00", pads: P_VOLCANIC, glossy: false },
  // { id: "ivory-coast", name: "IVORY COAST", subtitle: "Smooth Textures", chassisColor: "#F2E9E4", hardwareFinish: "gold" as const, vinylColor: "#C9ADA7", pads: P_DESERT, glossy: false },
  //  { id: "petrol-green", name: "PETROL", subtitle: "Deep Sea Petroleum", chassisColor: "#005F73", hardwareFinish: "silver" as const, vinylColor: "#0A9396", pads: P_ICE, glossy: true },
  //  { id: "carbon-fiber", name: "CARBON CORE", subtitle: "Pro Performance", chassisColor: "#1A1A1A", hardwareFinish: "black" as const, vinylColor: "#333333", pads: P_BLACK, glossy: false },
]

// ==========================================
// UTILITÁRIOS
// ==========================================
function easeInOutQuart(x: number): number { return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2 }
function easeInOutCubic(x: number): number { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
}

function Sphere3DButton({ color, isSelected, onClick, title, size = "w-8 h-8" }: any) {
  const sphereStyle = {
    background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.35) 0%, transparent 45%), linear-gradient(135deg, ${color} 0%, ${color} 100%)`,
    boxShadow: isSelected
      ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px rgba(0,0,0,0.5), 0 4px 12px ${color}88, inset 0 -2px 4px rgba(0,0,0,0.3)`
      : `0 4px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.4)`
  }
  return (
    <button onClick={onClick} className={`relative ${size} rounded-full transition-transform duration-300 hover:scale-110 focus:outline-none cursor-pointer shrink-0`} style={sphereStyle} title={title}>
      <span className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 40% 20%, rgba(255,255,255,0.3) 0%, transparent 100%)" }} />
    </button>
  )
}

// ==========================================
//  COMPONENTE UI (HTML DA SEÇÃO)
// ==========================================

// Calcula luminância relativa de uma cor hex para decidir se dots devem ser pretos ou brancos
function getDotColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

export function ThemeGalleryUI() {
  const containerRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null) // <- Nova referência pro Fundo!

  const { activeThemeId, setActiveThemeId } = useThemeGalleryStore()

  const activeTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0]

  // Função auxiliar se não estiver no topo do arquivo
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
  }

  const getDotColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) > 0.55 ? "#000000" : "#ffffff";
  }

  const rgbColor = hexToRgb(activeTheme.chassisColor)
  const dotColor = getDotColor(activeTheme.chassisColor)

  useEffect(() => {
    const unsubscribe = useScrollStore.subscribe((state) => {
      const progress = state.progress
      const section = SCROLL_SECTIONS.showroom as { start: number; end: number }

      const entryStart = section.start - 0.04
      const entryEnd = section.start + 0.04
      const exitStart = section.end - 0.04
      const exitEnd = SCROLL_SECTIONS.gallery.start + 0.01

      let slideTransform = -100
      let isVisible = false

      if (progress < entryStart) {
        slideTransform = 100
      } else if (progress >= entryStart && progress < entryEnd) {
        slideTransform = 100 - (easeInOutQuart((progress - entryStart) / (entryEnd - entryStart)) * 100)
        isVisible = true
      } else if (progress >= entryEnd && progress < exitStart) {
        slideTransform = 0
        isVisible = true
      } else if (progress >= exitStart && progress < exitEnd) {
        slideTransform = -(easeInOutCubic((progress - exitStart) / (exitEnd - exitStart)) * 100)
        isVisible = true
      }

      // 1. Aplica a animação no container principal (Textos e Dots)
      if (containerRef.current) {
        containerRef.current.style.display = isVisible ? "block" : "none"
        if (isVisible) {
          containerRef.current.style.transform = `translate3d(0, ${slideTransform}%, 0)`
        }
      }

      // 2. Controla a visibilidade do Fundo Colorido!
      if (bgRef.current) {
        // Mostra o fundo apenas na janela de exibição do Showroom
        const isStrictlyVisible = progress >= section.start - 0.05 && progress <= section.end + 0.05;
        bgRef.current.style.opacity = isStrictlyVisible ? "1" : "0"
        bgRef.current.style.pointerEvents = isStrictlyVisible ? "auto" : "none"
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <>
      {/* Adicionamos a bgRef e definimos opacity inicial 0 */}
      <div
        ref={bgRef}
        className="fixed z-10"
        style={{
          left: 0, right: 0, top: 0, height: "100vh",
          background: `rgba(${rgbColor}, 0.8)`,
          transition: "background 0.3s ease, opacity 0.3s ease",
          opacity: 0,
          pointerEvents: "none"
        }}
      />

      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        {/* Adicionamos o containerRef aqui */}
        <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ display: "none" }}>

          <div className="pt-12 lg:pt-32 px-12 lg:px-24">
            <h2 className="text-6xl lg:text-7xl font-inter font-medium text-white tracking-tighter leading-[0.9]">
              Signature<br /> editions
            </h2>
          </div>

          <div className="absolute bottom-[8vh] left-1/2 -translate-x-1/2 flex items-center gap-[10px] px-6 py-3 rounded-full pointer-events-auto"
            style={{ background: dotColor === "#ffffff" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: `1px solid ${dotColor === "#ffffff" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}
          >
            {THEMES.map((theme) => {
              const isActive = activeThemeId === theme.id;
              return (
                <button
                  key={theme.id} onClick={() => setActiveThemeId(theme.id)}
                  className="rounded-full transition-all duration-300 shrink-0"
                  style={{ width: isActive ? "14px" : "8px", height: isActive ? "14px" : "8px", backgroundColor: dotColor, opacity: isActive ? 1 : 0.32 }}
                  aria-label={theme.name}
                />
              );
            })}
          </div>

        </div>
      </div>
    </>
  )
}

export function ThemeGallery3D() {
  const activeThemeId = useThemeGalleryStore((s) => s.activeThemeId)
  const activeTheme = useMemo(() => THEMES.find(t => t.id === activeThemeId) || THEMES[0], [activeThemeId])

  const mat1Ref = useRef<THREE.MeshStandardMaterial>(null)
  const mat2Ref = useRef<THREE.MeshStandardMaterial>(null)

  const targetColor = useMemo(() => new THREE.Color(activeTheme.chassisColor), [activeTheme.chassisColor])

  useFrame((_, delta) => {
    if (mat1Ref.current) mat1Ref.current.color.lerp(targetColor, 1 - Math.pow(0.0001, delta))
    if (mat2Ref.current) mat2Ref.current.color.lerp(targetColor, 1 - Math.pow(0.0001, delta))
  })

  return (
    <group>
      {/* 
       <ContactShadows
        position={[0, -0.615, 0]}
        opacity={0.4}
        scale={80}
        blur={80}
        far={5}
        resolution={1024}
        color="#000000"
      />
      */}

    </group>
  )
}
export { THEMES }
