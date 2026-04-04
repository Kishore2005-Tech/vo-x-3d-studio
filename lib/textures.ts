// textures.ts

"use client"

import { useMemo } from "react"
import * as THREE from "three"
import { useTexture } from "@react-three/drei"

export interface LoadedTextures {
  loaded: boolean
  [key: string]: any
}

export interface TurntableTexturesResult {
  loaded: boolean
  body?: LoadedTextures
  details?: LoadedTextures
  buttons?: LoadedTextures
  knobs?: LoadedTextures
  platterWall?: LoadedTextures
  [key: string]: any
}

const TEXTURE_CONFIGS: Record<string, { color: string; roughness: number; metalness: number }> = {
  body: { color: "#1a1a1a", roughness: 0.4, metalness: 0.6 },
  details: { color: "#111111", roughness: 0.35, metalness: 0.5 },
  buttons: { color: "#1a1a1a", roughness: 0.5, metalness: 0.3 },
  knobs: { color: "#111111", roughness: 0.4, metalness: 0.5 },
  rubber: { color: "#050505", roughness: 0.95, metalness: 0.0 },
  platterWall: { color: "#111111", roughness: 0.5, metalness: 0.4 },
}

export function useTurntableTextures(): TurntableTexturesResult {
  return useMemo(() => {
    const result: TurntableTexturesResult = { loaded: true }
    for (const [key, config] of Object.entries(TEXTURE_CONFIGS)) {
      result[key] = {
        loaded: true,
        color: config.color,
        roughness: config.roughness,
        metalness: config.metalness,
      }
    }
    return result
  }, [])
}

export interface PBRTextureSet {
  map?: THREE.Texture
  normalMap?: THREE.Texture
  roughnessMap?: THREE.Texture
  metalnessMap?: THREE.Texture
  aoMap?: THREE.Texture
}

export interface AllPBRTextures {
  gold: PBRTextureSet
  metalCromo: PBRTextureSet
  metalPaintedPreto: PBRTextureSet
  plasticPowder: PBRTextureSet
  powderMetal: PBRTextureSet
  mixerPowder: PBRTextureSet
}

function configureTexture(tex: THREE.Texture | undefined, isColorMap: boolean, repeatX = 2, repeatY = 2) {
  if (!tex) return undefined;

  tex.colorSpace = isColorMap ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.flipY = false

  return tex
}

export function usePBRTextures(): AllPBRTextures {
  const [
    goldColor, goldNormal, goldRoughness, goldMetallic, goldAO,
    cromoColor, cromoNormal, cromoRoughness, cromoMetalness,
    pretoColor, pretoNormal, pretoRoughness, pretoMetallic, pretoAO,
    plasticColor, plasticNormal, plasticRoughness,
    pmNormal, pmRoughness, pmMetallic, pmAO
  ] = useTexture([
    "/textures/gold_1_baseColor.jpeg",
    "/textures/gold_1_normal.jpeg",
    "/textures/gold_1_roughness.jpeg",
    "/textures/gold_1_metallic.jpeg",
    "/textures/gold_1_ambientOcclusion.jpeg",

    "/textures/MetalCromoBrilho_1K-JPG_Color.jpg",
    "/textures/MetalCromoBrilho_1K-JPG_NormalGL.jpg",
    "/textures/MetalCromoBrilho_1K-JPG_Roughness.jpg",
    "/textures/MetalCromoBrilho_1K-JPG_Metalness.jpg",

    "/textures/MetalPaintedPreto_BaseColor.jpg",
    "/textures/MetalPaintedPreto_Normal.png",
    "/textures/MetalPaintedPreto_Roughness.jpg",
    "/textures/MetalPaintedPreto_Metallic.jpg",
    "/textures/MetalPaintedPreto_AmbientOcclusion.jpg",

    "/textures/Plastic-Powder_Color.jpg",
    "/textures/Plastic-Powder_NormalGL.jpg",
    "/textures/Plastic-Powder_Roughness.jpg",

    "/textures/powder-metal_normal-ogl.jpg",
    "/textures/powder-metal_roughness.jpg",
    "/textures/powder-metal_metallic.jpg",
    "/textures/powder-metal_ao.jpg"
  ])

  return useMemo(() => {
    return {
      gold: {
        map: configureTexture(goldColor, true, 3, 3),
        normalMap: configureTexture(goldNormal, false, 3, 3),
        roughnessMap: configureTexture(goldRoughness, false, 3, 3),
        metalnessMap: configureTexture(goldMetallic, false, 3, 3),
        aoMap: configureTexture(goldAO, false, 3, 3),
      },
      metalCromo: {
        map: configureTexture(cromoColor, true, 4, 4),
        normalMap: configureTexture(cromoNormal, false, 4, 4),
        roughnessMap: configureTexture(cromoRoughness, false, 4, 4),
        metalnessMap: configureTexture(cromoMetalness, false, 4, 4),
      },
      metalPaintedPreto: {
        map: configureTexture(pretoColor, true, 2, 2),
        normalMap: configureTexture(pretoNormal, false, 2, 2),
        roughnessMap: configureTexture(pretoRoughness, false, 2, 2),
        metalnessMap: configureTexture(pretoMetallic, false, 2, 2),
        aoMap: configureTexture(pretoAO, false, 2, 2),
      },
      plasticPowder: {
        map: configureTexture(plasticColor, true, 3, 3),
        normalMap: configureTexture(plasticNormal, false, 3, 3),
        roughnessMap: configureTexture(plasticRoughness, false, 3, 3),
      },
      powderMetal: {
        normalMap: configureTexture(pmNormal, false, 4, 4),
        roughnessMap: configureTexture(pmRoughness, false, 4, 4),
        metalnessMap: configureTexture(pmMetallic, false, 4, 4),
        aoMap: configureTexture(pmAO, false, 4, 4),
      },

      mixerPowder: {
        normalMap: configureTexture(pmNormal, false, 8, 8),
        roughnessMap: configureTexture(pmRoughness, false, 8, 8),
      }
    }
  }, [
    goldColor, goldNormal, goldRoughness, goldMetallic, goldAO,
    cromoColor, cromoNormal, cromoRoughness, cromoMetalness,
    pretoColor, pretoNormal, pretoRoughness, pretoMetallic, pretoAO,
    plasticColor, plasticNormal, plasticRoughness,
    pmNormal, pmRoughness, pmMetallic, pmAO
  ])
}

useTexture.preload([
  "/textures/gold_1_baseColor.jpeg",
  "/textures/gold_1_normal.jpeg",
  "/textures/gold_1_roughness.jpeg",
  "/textures/gold_1_metallic.jpeg",
  "/textures/gold_1_ambientOcclusion.jpeg",
  "/textures/MetalCromoBrilho_1K-JPG_Color.jpg",
  "/textures/MetalCromoBrilho_1K-JPG_NormalGL.jpg",
  "/textures/MetalCromoBrilho_1K-JPG_Roughness.jpg",
  "/textures/MetalCromoBrilho_1K-JPG_Metalness.jpg",
  "/textures/MetalPaintedPreto_BaseColor.jpg",
  "/textures/MetalPaintedPreto_Normal.png",
  "/textures/MetalPaintedPreto_Roughness.jpg",
  "/textures/MetalPaintedPreto_Metallic.jpg",
  "/textures/MetalPaintedPreto_AmbientOcclusion.jpg",
  "/textures/Plastic-Powder_Color.jpg",
  "/textures/Plastic-Powder_NormalGL.jpg",
  "/textures/Plastic-Powder_Roughness.jpg",
  "/textures/powder-metal_normal-ogl.jpg",
  "/textures/powder-metal_roughness.jpg",
  "/textures/powder-metal_metallic.jpg",
  "/textures/powder-metal_ao.jpg"
])