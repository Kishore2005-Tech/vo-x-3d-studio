// color-picker-premium.tsx

"use client"

import { useScrollStore, CHASSIS_COLORS, HARDWARE_FINISHES, VINYL_COLORS, SCROLL_SECTIONS } from "@/lib/scroll-store"
import { useMemo } from "react"

function easeInOutQuart(x: number): number { return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2 }
function easeInOutCubic(x: number): number { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }

function Sphere3DButton({ color, isSelected, onClick, title, isMetallic = false, size = "w-8 h-8" }: any) {
  const sphereStyle = isMetallic
    ? { background: `radial-gradient(circle at 35% 25%, rgba(255,255,255,0.7) 0%, transparent 40%), radial-gradient(circle at 65% 75%, rgba(0,0,0,0.5) 0%, transparent 50%), radial-gradient(circle at 50% 50%, ${color} 0%, ${color} 100%)`, boxShadow: isSelected ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 0 3px ${color}, 0 4px 12px ${color}66, inset 0 -2px 4px rgba(0,0,0,0.4)` : `0 4px 8px rgba(0,0,0,0.15), inset 0 -2px 4px rgba(0,0,0,0.2)` }
    : { background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.35) 0%, transparent 45%), linear-gradient(135deg, ${color} 0%, ${color} 100%)`, boxShadow: isSelected ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 0 3px ${color}, 0 4px 12px ${color}66, inset 0 -2px 4px rgba(0,0,0,0.3)` : `0 4px 8px rgba(0,0,0,0.1), inset 0 -2px 4px rgba(0,0,0,0.15)` }
  return (
    <button onClick={onClick} className={`relative ${size} rounded-full transition-transform duration-300 hover:scale-110 focus:outline-none cursor-pointer shrink-0`} style={sphereStyle} title={title}>
      <span className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 40% 20%, rgba(255,255,255,0.2) 0%, transparent 100%)" }} />
    </button>
  )
}

export function ColorPickerPremium() {
  const {
    progress, chassisColor, setChassisColor, hardwareFinish, setHardwareFinish, vinylColor, setVinylColor,
    mixerColor, setMixerColor, showGlossyTop, showFaceplate, toggleGlossyTop, toggleFaceplate, activeCustomizer, setActiveCustomizer
  } = useScrollStore()

  const customizeSection = SCROLL_SECTIONS.customize as { start: number; end: number }

  const isStrictlyVisible = progress >= customizeSection.start - 0.05 && progress <= customizeSection.end + 0.05;

  const entryStart = customizeSection.start - 0.04
  const entryEnd = customizeSection.start + 0.04
  const exitStart = customizeSection.end - 0.04
  const exitEnd = customizeSection.end + 0.02

  const slideTransform = useMemo(() => {
    if (progress < entryStart) return 100
    if (progress >= entryStart && progress < entryEnd) return 100 - (easeInOutQuart((progress - entryStart) / (entryEnd - entryStart)) * 100)
    if (progress >= entryEnd && progress < exitStart) return 0
    if (progress >= exitStart && progress < exitEnd) return -(easeInOutCubic((progress - exitStart) / (exitEnd - exitStart)) * 100)
    return -100
  }, [progress, entryStart, entryEnd, exitStart, exitEnd])

  if (!isStrictlyVisible) return null

  const isMixer = activeCustomizer === "mixer"
  const glassCardClasses = "rounded-[24px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] pointer-events-auto"

  return (
    <>
      <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 w-full h-full flex flex-col items-center pt-24" style={{ transform: `translateY(${slideTransform}%)`, background: 'radial-gradient(ellipse 120% 100% at 50% 50%, #e8e8e8 0%, #e8e8e8 60%, #e8e8e8 100%)' }}>
          <h1 className="text-[10vw] font-zen-dots mt-16 tracking-tighter text-black/[0.03] select-none leading-none">CUST0MIZE</h1>
        </div>
      </div>

      <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 w-full h-full" style={{ transform: `translateY(${slideTransform}%)` }}>

          <div className="absolute top-[12vh] left-0 right-0 flex justify-center pointer-events-auto z-40">
            <div className="flex gap-2 p-1.5 rounded-full bg-white/50 backdrop-blur-xl border border-white/80 shadow-sm">
              <button onClick={() => setActiveCustomizer("turntable")} className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.15em] transition-all duration-500 ${!isMixer ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}>TURNTABLE</button>
              <button onClick={() => setActiveCustomizer("mixer")} className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.15em] transition-all duration-500 ${isMixer ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}>MIXER</button>
            </div>
          </div>

          <div className={`absolute inset-0 w-full h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isMixer ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
            <div className={`absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 flex flex-col items-center p-3 py-5 w-[85px] lg:w-[100px] ${glassCardClasses}`}>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/40 mb-4">CHASSIS</span>
              <div className="flex flex-col gap-3">{CHASSIS_COLORS.map((o) => (<Sphere3DButton key={o.color} color={o.color} isSelected={chassisColor === o.color} onClick={() => setChassisColor(o.color)} title={o.name} />))}</div>
            </div>
            <div className={`absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center p-3 py-5 w-[85px] lg:w-[100px] ${glassCardClasses}`}>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/40 mb-4">DISC</span>
              <div className="flex flex-col gap-3">{VINYL_COLORS.map((o) => (<Sphere3DButton key={o.color} color={o.color} isSelected={vinylColor === o.color} onClick={() => setVinylColor(o.color)} title={o.name} />))}</div>
            </div>
            <div className={`absolute bottom-[10vh] left-1/2 -translate-x-1/2 flex flex-col items-center px-6 py-4 ${glassCardClasses}`}>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/40 mb-3">HARDWARE</span>
              <div className="flex gap-5">{HARDWARE_FINISHES.map((o) => (<Sphere3DButton key={o.value} color={o.color} isSelected={hardwareFinish === o.value} onClick={() => setHardwareFinish(o.value)} title={o.name} isMetallic size="w-9 h-9" />))}</div>
            </div>
          </div>

          <div className={`absolute inset-0 w-full h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${!isMixer ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
            <div className={`absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 flex flex-col items-center p-3 py-5 w-[85px] lg:w-[100px] ${glassCardClasses}`}>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-black/40 mb-4">COLOR</span>
              <div className="flex flex-col gap-3">{CHASSIS_COLORS.map((o) => (<Sphere3DButton key={o.color} color={o.color} isSelected={mixerColor === o.color} onClick={() => setMixerColor(o.color)} title={o.name} />))}</div>
            </div>
            <div className={`absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 flex flex-col justify-center items-center gap-3 w-[110px] lg:w-[130px]`}>
              <button onClick={toggleGlossyTop} className={`w-full p-3 py-4 flex flex-col items-center justify-center transition-all duration-300 ${glassCardClasses} ${showGlossyTop ? 'border-black/20 shadow-lg scale-100' : 'opacity-50 grayscale scale-95'}`}>
                <div className={`w-7 h-7 mb-2 rounded-md transition-colors ${showGlossyTop ? 'bg-[#0a0a0a]' : 'bg-transparent border-2 border-gray-400'}`} />
                <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-black text-center leading-tight">GLOSSY<br />PANEL</span>
              </button>
              <button onClick={toggleFaceplate} className={`w-full p-3 py-4 flex flex-col items-center justify-center transition-all duration-300 ${glassCardClasses} ${showFaceplate ? 'border-black/20 shadow-lg scale-100' : 'opacity-50 grayscale scale-95'}`}>
                <div className={`w-7 h-7 mb-2 rounded-md transition-colors ${showFaceplate ? 'bg-[#1a1a1a]' : 'bg-transparent border-2 border-gray-400'}`} />
                <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-black text-center leading-tight">MATTE<br />FACEPLATE</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
