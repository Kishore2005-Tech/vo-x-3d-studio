// materials.tsx

"use client"

import type { LoadedTextures, PBRTextureSet, AllPBRTextures } from "@/lib/textures"
import * as THREE from 'three'

export function ConfigurableMaterial({ textures, configKey }: { textures?: LoadedTextures; configKey: string }) {
  const config = textures || { color: "#1a1a1a", roughness: 0.4, metalness: 0.5 }
  return (
    <meshStandardMaterial
      color={config.color || "#1a1a1a"}
      roughness={config.roughness ?? 0.4}
      metalness={config.metalness ?? 0.5}
    />
  )
}

export const MatBlackPlasticHeadshell = () => <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.1} />
export const MatWhitePlasticHeadshell = () => <meshStandardMaterial color="#f5f5f5" roughness={0.4} metalness={0.05} />
export const MatChromeHeadshell = () => <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.95} />
export const MatGoldHeadshell = () => <meshStandardMaterial color="#D4AF37" roughness={0.15} metalness={0.95} envMapIntensity={0.6} />
export const MatScrewSlotHeadshell = () => <meshStandardMaterial color="#111111" roughness={0.8} metalness={0.2} />
export const WireRedMatHeadshell = () => <meshStandardMaterial color="#cc0000" roughness={0.5} metalness={0.2} />
export const WireWhiteMatHeadshell = () => <meshStandardMaterial color="#f5f5f5" roughness={0.5} metalness={0.2} />
export const WireGreenMatHeadshell = () => <meshStandardMaterial color="#00cc00" roughness={0.5} metalness={0.2} />
export const WireBlueMatHeadshell = () => <meshStandardMaterial color="#0066cc" roughness={0.5} metalness={0.2} />


export function GoldPBRMaterial({ textures, metalness = 0.95, roughness = 0.15 }: { textures: PBRTextureSet; metalness?: number; roughness?: number }) {
  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      metalnessMap={textures.metalnessMap}
      aoMap={textures.aoMap}
      metalness={metalness}
      roughness={roughness}
      envMapIntensity={1.2}
    />
  )
}

export function MetalCromoPBRMaterial({ textures, metalness = 0.95, roughness = 0.05 }: { textures: PBRTextureSet; metalness?: number; roughness?: number }) {
  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      metalnessMap={textures.metalnessMap}
      metalness={metalness}
      roughness={roughness}
      envMapIntensity={1.5}
    />
  )
}

export function PlasticPowderPBRMaterial({ textures, color }: { textures: PBRTextureSet; color?: string }) {
  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      color={color}
      metalness={0.2}
      roughness={0.65}
      normalScale={new THREE.Vector2(3, 3)}
    />
  )
}

export function MetalPaintedPretoPBRMaterial({ textures }: { textures: PBRTextureSet }) {
  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      metalnessMap={textures.metalnessMap}
      aoMap={textures.aoMap}
      metalness={0.6}
      roughness={0.4}
    />
  )
}

export function PowderMetalChassisMaterial({ textures, color }: { textures: PBRTextureSet; color: string }) {
  return (
    <meshStandardMaterial
      color={color}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      metalnessMap={textures.metalnessMap}
      aoMap={textures.aoMap}
      normalScale={new THREE.Vector2(1.5, 1.5)}
      metalness={0.4}
      roughness={0.65}
      envMapIntensity={1.5}
    />
  )
}

export function MixerChassisMaterial({ pbr, cor }: { pbr: AllPBRTextures, cor: string }) {
  return (
    <meshStandardMaterial
      color={cor}
      normalMap={pbr.powderMetal.normalMap}
      roughnessMap={pbr.powderMetal.roughnessMap}
      metalnessMap={pbr.powderMetal.metalnessMap}
      aoMap={pbr.powderMetal.aoMap}
      normalScale={new THREE.Vector2(1.5, 1.5)}
      metalness={0.4}
      roughness={0.65}
      envMapIntensity={1.5}
    />
  )
}

export function HardwareFinishMaterial({ finish, pbr, part = "tube" }: {
  finish: "black" | "gold" | "silver"
  pbr: AllPBRTextures
  part?: "tube" | "screw" | "body"
}) {
  if (finish === "gold") {

    if (part === "body") {
      return (
        <meshStandardMaterial
          map={pbr.gold.map}
          metalness={1.0}
          roughness={0.3}
          envMapIntensity={1}
        />
      )
    }

    return <GoldPBRMaterial textures={pbr.gold} metalness={0.95} roughness={0.12} />
  }

  if (finish === "silver") {
    return <MetalCromoPBRMaterial textures={pbr.metalCromo} metalness={0.95} roughness={0.05} />
  }

  return (
    <meshStandardMaterial
      map={pbr.metalPaintedPreto.map}
      normalMap={pbr.metalPaintedPreto.normalMap}
      roughnessMap={pbr.metalPaintedPreto.roughnessMap}
      metalnessMap={pbr.metalPaintedPreto.metalnessMap}
      aoMap={pbr.metalPaintedPreto.aoMap}
      color="#0a0a0a"
      metalness={0.85}
      roughness={0.15}
      envMapIntensity={1.2}
    />
  )
}


export function MixerChassisMaterialbk({ pbr, cor }: { pbr: AllPBRTextures, cor: string }) {
  return (
    <meshStandardMaterial
      color={cor}
      normalMap={pbr.powderMetal.normalMap}
      roughnessMap={pbr.powderMetal.roughnessMap}
      roughness={0.75}
      metalness={0.2}
      normalScale={new THREE.Vector2(1, 1)}
    />
  )
}

export function MixerChassisMaterialbbkk({ pbr, cor }: { pbr: AllPBRTextures, cor: string }) {
  return (
    <meshStandardMaterial
      color={cor}
      normalMap={pbr.mixerPowder.normalMap}
      roughnessMap={pbr.mixerPowder.roughnessMap}
      normalScale={new THREE.Vector2(1, 1)}
      roughness={0.99}
      metalness={0.1}
    />
  )
}