// interaction-store.tsx
"use client"

import { create } from "zustand"

interface InteractionState {
  powerOn: boolean
  startOn: boolean

  faderValues: { ch1: number; ch2: number; crossfader: number }

  togglePower: () => void
  toggleStart: () => void
  setFaderValue: (name: "ch1" | "ch2" | "crossfader", value: number) => void
  triggerPad: (index: number) => void
  tick: (delta: number) => void
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  powerOn: true,
  startOn: true,
  faderValues: { ch1: 0.7, ch2: 0.3, crossfader: 0.5 },

  togglePower: () => {
    const { powerOn } = get()
    if (powerOn) {
      set({ powerOn: false, startOn: false })
    } else {
      set({ powerOn: true })
    }
  },

  toggleStart: () => {
    const { powerOn, startOn } = get()
    if (!powerOn) return
    set({ startOn: !startOn })
  },

  setFaderValue: (name, value) => {
    const { faderValues } = get()
    set({ faderValues: { ...faderValues, [name]: Math.max(0, Math.min(1, value)) } })
  },

  triggerPad: () => { },
  tick: () => { },
}))