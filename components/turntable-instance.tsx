// turntable-instance.tsx
// Renders the second turntable (TT2) in the final setup section.
// Uses a full TurntableModel (not a clone) so that isPlaying/powerOn work correctly:
// prato gira, LEDs acendem, dots no inner ring se movem — idêntico ao TT principal.

"use client"

import React from "react"
import { TurntableModel } from "./turntable-3d"

// ============================================================
// TurntableGeometryProvider — mantido para compatibilidade de import
// no page.tsx, mas agora é apenas um passthrough.
// ============================================================
export function TurntableGeometryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// ============================================================
// INSTANCE COMPONENT
// ============================================================

type HardwareFinish = "black" | "gold" | "silver"

interface TurntableInstanceProps {
  chassisColor: string
  hardwareFinish?: HardwareFinish
  vinylColor?: string
  /** Se true, prato e disco giram e LEDs acendem */
  isPlaying?: boolean
  powerOn?: boolean
}

function TurntableInstanceInner({
  chassisColor,
  hardwareFinish = "gold",
  vinylColor = "#050505",
  isPlaying = false,
  powerOn = true,
}: TurntableInstanceProps) {
  return (
    <TurntableModel
      chassisColor={chassisColor}
      hardwareFinish={hardwareFinish}
      vinylColor={vinylColor}
      explosionFactor={0}
      isPlaying={isPlaying}
      powerOn={powerOn}
    />
  )
}

export const TurntableInstance = React.memo(TurntableInstanceInner)
