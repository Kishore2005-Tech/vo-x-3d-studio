// loading-screen.tsx

"use client"

import { useProgress } from "@react-three/drei"
import { useEffect, useState } from "react"

export function LoadingScreen() {
  const { progress } = useProgress()
  const [isLoaded, setIsLoaded] = useState(false)


  const displayProgress = Math.min(Math.round(progress), 100)

  useEffect(() => {
    document.body.style.overflow = "hidden"

    if (progress >= 100) {

      const timer = setTimeout(() => {
        setIsLoaded(true)
        document.body.style.overflow = "auto"
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [progress])

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center transition-transform duration-[1200ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${isLoaded ? "-translate-y-full" : "translate-y-0"
        }`}
    >
      <div className="flex flex-col items-center justify-center translate-y-[-10vh]">
        <h1 className="text-5xl text-white font-zen-dots mb-8 tracking-tighter">V0X3D</h1>

        <p className="text-white/40 tracking-[0.4em] text-[10px] uppercase font-light mb-4">
          Loading Experience {displayProgress}%
        </p>

        <div className="w-64 h-[1px] bg-white/10 overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    </div>
  )
}