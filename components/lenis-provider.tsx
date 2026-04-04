// lenis-provider.tsx

"use client"

import { useEffect, useRef } from "react"
import Lenis from "lenis"

/**
 * LenisProvider — Smooth scroll otimizado para performance premium
 * Configurações ajustadas para scroll fluido sem travamentos
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Configuração otimizada para scroll suave
    const lenis = new Lenis({
      duration: 1.2, // Aumentado para scroll mais suave
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.5, // Aumentado para melhor resposta em touch
      infinite: false,
    })

    lenisRef.current = lenis

    // RAF otimizado com timestamp para melhor performance
    function raf(time: number) {
      lenis.raf(time)
      rafIdRef.current = requestAnimationFrame(raf)
    }

    rafIdRef.current = requestAnimationFrame(raf)

    // Cleanup completo
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
