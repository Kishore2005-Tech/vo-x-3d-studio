// page.tsx

"use client"

import React, { Suspense, useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, ContactShadows, Environment, useTexture, Lightformer, CubicBezierLine } from "@react-three/drei"
import * as THREE from "three"
import { TurntableModel } from "@/components/turntable-3d"
import { MixerV0X3D } from "@/components/mixer-3d"
import { useScrollStore, SCROLL_SECTIONS, SECTION_COLORS } from "@/lib/scroll-store"
import { useInteractionStore } from "@/lib/interaction-store"
import { EffectComposer, Vignette } from "@react-three/postprocessing"
import { ScrollProgress, ScrollHandler } from "@/components/ui-overlay"
import { ColorPickerPremium } from "@/components/color-picker-premium"
import { SectionContentImproved } from "@/components/section-content-improved"
import { BentoCards } from "@/components/bento-cards"
import { BulletPointsOverlay } from "@/components/bullet-points-overlay"
import { HorizontalGallery } from "@/components/horizontal-gallery"
import { LoadingScreen } from "@/components/loading-screen"
import { TurntableGeometryProvider } from "@/components/turntable-instance"
import { ThemeGalleryUI, ThemeGallery3D, useThemeGalleryStore, THEMES } from "@/components/theme-gallery-section"
import { BlackoutOverlay } from "@/components/blackout-overlay"
import { PhilosophySection } from "@/components/philosophy-section"
import { DragRing } from "@/components/drag-ring"


const lerp = THREE.MathUtils.lerp

function easeInOutCubic(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

// ===== ESTADOS DE MOVIMENTAÇÃO DA CÂMERA =====
const SCENE_STATES: Record<string, { camPos: number[]; camTarget: number[]; fov: number; ttPos: number[]; mxPos: number[]; showroomPos: number[] }> = {

  hero: {
    camPos: [2, 3, 9], camTarget: [0, 0, 0], fov: 28, ttPos: [-1.55, 0, 0.05], mxPos: [2.3, 0, 0.05], showroomPos: [0, -40, 0]
  },

  tt_intro: {
    camPos: [-1.12, 3.35, 3.80], camTarget: [-2.80, 0.03, 0.1], fov: 24, ttPos: [-1.55, 0, 0.05], mxPos: [2.3, 0, 0.05], showroomPos: [0, -100, 0]
  },

  tt_angle_1: {
    camPos: [-2.90, 1.66, 3.86], camTarget: [-1.17, -0.03, -0.03], fov: 36, ttPos: [-1.55, 0, 0.05], mxPos: [2.3, 0, 0.05], showroomPos: [0, -100, 0]
  },

  tt_angle_2: {
    camPos: [3, 1, 2], camTarget: [-2, 0, -0.02], fov: 26, ttPos: [-1.55, 0, 0.05], mxPos: [2.3, 0, 0.05], showroomPos: [0, -100, 0]
  },

  tt_detail: {
    camPos: [3.15, 0.41, -2.34], camTarget: [0.50, 0.30, 0.00], fov: 28, ttPos: [0.00, 0.00, 0.00], mxPos: [4, 0, 0.05], showroomPos: [0, -100, 0]
  },

  tt_brand_focus: {
    camPos: [-3, 4.5, 11], camTarget: [0, 1.6, 0], fov: 26, ttPos: [0, 2, 2], mxPos: [6.00, -20.00, 0.00], showroomPos: [0, -100, 0]
  },
  exploded: {
    camPos: [0, 3, 8], camTarget: [0, 0.6, 0], fov: 30, ttPos: [0, 0, 0], mxPos: [15.00, -20.00, 0.00], showroomPos: [0, -100, 0]
  },
  bento: {
    camPos: [2, 3.15, 1.80], camTarget: [4.80, -1.60, -3], fov: 33, ttPos: [-2.55, 0, 0.05], mxPos: [0, 0, 0.05], showroomPos: [0, -100, 0]
  },

  mx_intro: {
    camPos: [-1.5, 4.2, 8], camTarget: [1.5, 0, 0], fov: 18, ttPos: [0, -20, 0], mxPos: [2, 0, 0], showroomPos: [0, -100, 0]
  },
  mx_features: {
    camPos: [1.5, 4.5, 5], camTarget: [-2, 0, 0], fov: 20, ttPos: [0, -20, 0], mxPos: [-2.5, 0, 0], showroomPos: [0, -100, 0]
  },
  mx_detail: {
    camPos: [1, 1.00, -4.50], camTarget: [-3.34, -1, -1], fov: 22, ttPos: [0.00, -20.00, 0.00], mxPos: [-2.10, 0.00, 0.00], showroomPos: [0, -100, 0]
  },
  mx_exploded: {
    camPos: [-2, 2, 9], camTarget: [-2.5, 0, 0], fov: 21, ttPos: [0, -20, 0], mxPos: [-2.5, 0, 0], showroomPos: [0, -100, 0]
  },

  customize: {
    camPos: [0, 4.5, 8.5], camTarget: [1.1, -0.2, 0], fov: 32, ttPos: [1.1, 0, 0], mxPos: [1.1, 0, 0], showroomPos: [0, -100, 0]
  },
  philosophy: {
    camPos: [-1, 7, 10], camTarget: [0, 0, 0], fov: 25, ttPos: [-4.5, 2, 5.0], mxPos: [3, 0.5, 4], showroomPos: [0, -30, 0]
  },
  showroom: {
    camPos: [-2, 6, 9.5], camTarget: [0, 0, 0], fov: 30, ttPos: [-1.25, 0, 0], mxPos: [2.3, 0.08, 0], showroomPos: [0, 0, 0]
  },
  gallery: {
    camPos: [0, 4, 9], camTarget: [0, -0.75, 0], fov: 36, ttPos: [-1.6, 0, 0], mxPos: [2, 0.1, 0], showroomPos: [0, -100, 0]
  },

  setup_hold: {
    camPos: [0, 4, 9], camTarget: [0, -0.75, 0], fov: 36, ttPos: [-1.6, 0, 0], mxPos: [2, 0.1, 0], showroomPos: [0, -100, 0]
  },

  setup_reveal: {
    camPos: [0, 4, 9], camTarget: [0, -0.75, 0], fov: 36, ttPos: [-1.6, 0, 0], mxPos: [2, 0.1, 0], showroomPos: [0, -100, 0]
  },
  outro: {
    camPos: [0, 4, 9], camTarget: [0, -0.75, 0], fov: 36, ttPos: [-1.6, 0, 0], mxPos: [2, 0.1, 0], showroomPos: [0, -100, 0]
  },

  neutral: {
    camPos: [0, 5, 10], camTarget: [0, 0, 0], fov: 35, ttPos: [0, 0, 0], mxPos: [0, -20, 0], showroomPos: [0, -100, 0]
  },

}

const ENVIRONMENT_COLOR = "#000000";

// ===== PAINEL DE LUZES  =====
const LIGHTING_STATES: Record<string, { env: number; dir: number; floor: number; spot: number; spotPos: number[]; rimL: number; rimR: number; back: number }> = {
  hero: { env: 0.6, dir: 1.6, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  tt_intro: { env: 0.6, dir: 1.6, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  tt_angle_1: { env: 0.6, dir: 1.6, floor: 0.0, spot: 0, spotPos: [6, 12, 0], rimL: 0, rimR: 0, back: 0 },
  tt_angle_2: { env: 0.6, dir: 1.6, floor: 0.0, spot: 0, spotPos: [-6, 12, 0], rimL: 0, rimR: 0, back: 0 },
  tt_detail: { env: 0.9, dir: 1.6, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  tt_brand_focus: { env: 0.7, dir: 1.4, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  exploded: { env: 0.6, dir: 0.9, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  bento: { env: 0.6, dir: 1.6, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  mx_intro: { env: 0.3, dir: 0.0, floor: 0.0, spot: 500, spotPos: [2, 14, 4], rimL: 200, rimR: 200, back: 200 },
  mx_features: { env: 0.4, dir: 0.6, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  mx_detail: { env: 0.8, dir: 0.0, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  mx_exploded: { env: 0.6, dir: 1.2, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  showroom: { env: 0.7, dir: 1.0, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  gallery: { env: 0.7, dir: 1.0, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  customize: { env: 0.7, dir: 1.0, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  philosophy: { env: 0.7, dir: 1.0, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },

  setup_hold: { env: 0.7, dir: 1.0, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  setup_reveal: { env: 0.6, dir: 1.6, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  outro: { env: 0.3, dir: 0.3, floor: 1.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 },
  neutral: { env: 0.3, dir: 0.1, floor: 0.0, spot: 0, spotPos: [0, 14, 4], rimL: 0, rimR: 0, back: 0 }
}

const StageFloor = React.forwardRef<THREE.MeshStandardMaterial, any>((props, ref) => {
  const normalMap = useTexture("/textures/cracked_concrete_norgl.jpg");
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(16, 24);
  normalMap.anisotropy = 8;

  const alphaMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.6, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.LinearSRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh castShadow receiveShadow
      position={[0, -0.005, 0]}
      rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[70, 70]} />
      <meshStandardMaterial
        ref={ref}
        roughness={0.6}
        color={ENVIRONMENT_COLOR}
        normalMap={normalMap}
        alphaMap={alphaMap || undefined}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
});

StageFloor.displayName = "StageFloor";


function MasterLightingManager() {
  const { scene } = useThree()

  const refs = useRef({
    floorMat: null as THREE.MeshStandardMaterial | null,
    rubberFloorGroup: null as THREE.Group | null,
    outroLight: null as THREE.PointLight | null,
    outroFill: null as THREE.PointLight | null,
    shadowMat: null as THREE.ShadowMaterial | null,
    ambientLight: null as THREE.AmbientLight | null,
  });

  useFrame((state, delta) => {
    const p = useScrollStore.getState().progress
    const d = Math.min(delta, 0.1);

    const keys = Object.keys(SCROLL_SECTIONS)
    const sections = SCROLL_SECTIONS as Record<string, { start: number; end: number }>
    let startIndex = 0
    for (let i = 0; i < keys.length; i++) { if (p >= sections[keys[i]].start) startIndex = i }
    const endIndex = Math.min(startIndex + 1, keys.length - 1)

    const startState = LIGHTING_STATES[keys[startIndex]] || LIGHTING_STATES.neutral
    const endState = LIGHTING_STATES[keys[endIndex]] || LIGHTING_STATES.neutral
    const currentEnd = sections[keys[startIndex]].end
    const nextStart = sections[keys[endIndex]].start

    let easeP = 0
    if (p > currentEnd) easeP = easeInOutCubic(THREE.MathUtils.clamp((p - currentEnd) / (nextStart - currentEnd), 0, 1))

    scene.environmentIntensity = THREE.MathUtils.damp(scene.environmentIntensity || 0.6, lerp(startState.env, endState.env, easeP), 4, d)

    const currentFloor = lerp(startState.floor, endState.floor, easeP)
    if (refs.current.floorMat) refs.current.floorMat.opacity = THREE.MathUtils.damp(refs.current.floorMat.opacity, currentFloor, 4, d);
    if (refs.current.rubberFloorGroup) refs.current.rubberFloorGroup.visible = currentFloor > 0.01;

    const targetDir = lerp(startState.dir, endState.dir, easeP)
    if (refs.current.dirLight) refs.current.dirLight.intensity = THREE.MathUtils.damp(refs.current.dirLight.intensity, targetDir, 4, d)

    const outroSec = sections.outro;
    let outroIntensity = 0;
    let ambientTarget = 0.15;

    if (p >= outroSec.start - 0.05) {
      outroIntensity = Math.min(1, (p - (outroSec.start - 0.05)) / 0.1) * 5.0;
      ambientTarget = 0.40;
    }

    if (refs.current.outroLight) refs.current.outroLight.intensity = THREE.MathUtils.damp(refs.current.outroLight.intensity, outroIntensity, 4, d);
    if (refs.current.outroFill) refs.current.outroFill.intensity = THREE.MathUtils.damp(refs.current.outroFill.intensity, outroIntensity * 0.6, 4, d);
    if (refs.current.ambientLight) refs.current.ambientLight.intensity = THREE.MathUtils.damp(refs.current.ambientLight.intensity, ambientTarget, 4, d);

    const brandSec = sections.tt_brand_focus;
    let targetShadowOpacity = 0.3;

    if (p >= brandSec.start - 0.05 && p <= brandSec.end + 0.05) {
      targetShadowOpacity = 0.15;
    }

    if (refs.current.shadowMat) {
      refs.current.shadowMat.opacity = THREE.MathUtils.damp(refs.current.shadowMat.opacity, targetShadowOpacity, 4, d);
    }
  })

  return (
    <group>
      {/* <Environment resolution={512} files="/hdr/white_home_studio_1k.hdr" environmentIntensity={0.9} blur={1}> */}
      <Environment resolution={512}>
        <Lightformer intensity={1.5} rotation={[-Math.PI / 2, 0, 0]} position={[0, 5, 0]} scale={[20, 20, 1]} />
        <Lightformer intensity={2} rotation={[0, Math.PI / 2, 0]} position={[10, 2, 0]} scale={[20, 10, 1]} />
        <Lightformer intensity={0.8} rotation={[0, 0, 0]} position={[0, 2, 10]} scale={[20, 10, 1]} />
      </Environment>

      <directionalLight
        ref={(el) => refs.current.dirLight = el}
        castShadow
        position={[6, 10, 5]}
        intensity={2}
        color="#ffffff"
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.05} // Ajuda no contorno do disco
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.1, 50]} />
      </directionalLight>

      <ambientLight ref={(el) => refs.current.ambientLight = el} intensity={0.15} color="#eef5ff" />

      <pointLight ref={(el) => refs.current.outroLight = el} position={[0, 4.5, 1.5]} distance={15} decay={2} color="#ffffff" intensity={2} />
      <pointLight ref={(el) => refs.current.outroFill = el} position={[0, 2.0, 5.0]} distance={25} decay={2} color="#f8f4ee" intensity={2} />

      <group position={[0, -0.615, 0]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial ref={(el) => refs.current.shadowMat = el} transparent opacity={0.55} />
        </mesh>

        <group ref={(el) => refs.current.rubberFloorGroup = el}>
          <ContactShadows
            position={[0, 0.001, 0]}
            opacity={0.85}
            scale={30}
            blur={2}
            far={5}
            resolution={2048}
            color="#000000"
            frames={1}
          />
          <StageFloor ref={(el) => refs.current.floorMat = el} />
        </group>
      </group>
    </group>
  )
}


function SceneFog() {
  const { scene } = useThree()

  useFrame(() => {
    const p = useScrollStore.getState().progress
    const setupHoldSec = SCROLL_SECTIONS.setup_hold as { start: number; end: number }
    const setupRevealSec = SCROLL_SECTIONS.setup_reveal as { start: number; end: number }
    const outroSec = SCROLL_SECTIONS.outro as { start: number; end: number }

    if (p >= outroSec.start - 0.05) {
      if (!scene.fog || (scene.fog as THREE.Fog).color.getHexString() !== '080808') {
        scene.fog = new THREE.Fog('#080808', 10, 25)
      }
      const blend = Math.max(0, Math.min(1, (p - (outroSec.start - 0.05)) / 0.05))
        ; (scene.fog as THREE.Fog).near = lerp(80, 15, blend)
        ; (scene.fog as THREE.Fog).far = lerp(100, 30, blend)
    } else {
      let fogStrength = 0
      if (p >= setupHoldSec.start) {
        if (p < setupRevealSec.start) {
          const sp = (p - setupHoldSec.start) / (setupHoldSec.end - setupHoldSec.start)
          fogStrength = Math.min(1, sp * 1.5)
        } else if (p < outroSec.start - 0.05) {
          fogStrength = 1
        }
      }

      if (fogStrength > 0.01) {
        if (!scene.fog || (scene.fog as THREE.Fog).color.getHexString() !== '000000') {
          scene.fog = new THREE.Fog('#000000', 1, 13)
        }
        ; (scene.fog as THREE.Fog).far = lerp(80, 10, fogStrength)
      } else {
        if (scene.fog) scene.fog = null
      }
    }
  })
  return null
}


function BrandFocusOverlay() {
  const divRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const brandSec = SCROLL_SECTIONS.tt_brand_focus as { start: number; end: number }

    const unsub = useScrollStore.subscribe((state) => {
      const progress = state.progress
      let opacity = 0

      if (progress >= brandSec.start && progress <= brandSec.end) {
        const p = (progress - brandSec.start) / (brandSec.end - brandSec.start)
        if (p < 0.1) opacity = p / 0.1
        else if (p > 0.9) opacity = (1 - p) / 0.1
        else opacity = 1

        if (textRef.current) {
          textRef.current.style.transform = `translate3d(${-p * 60}vw, 0, 0)`
        }
      }

      if (divRef.current) {
        divRef.current.style.opacity = String(opacity)
        divRef.current.style.pointerEvents = opacity > 0 ? 'auto' : 'none'
      }
      if (textRef.current) {
        textRef.current.style.opacity = String(opacity)
      }
    })
    return unsub
  }, [])

  return (
    <div ref={divRef} className="absolute inset-0 z-[1] pointer-events-none will-change-[opacity]" style={{ backgroundColor: '#e8e8e8', opacity: 0 }}>
      <div className="fixed inset-0 z-[10] flex items-start pt-[12vh] overflow-hidden">
        <div ref={textRef} className="whitespace-nowrap select-none will-change-transform" style={{ opacity: 0 }}>
          <span className="text-[22vw] font-zen-dots font-black uppercase tracking-tight" style={{ color: "#1a1a1a", WebkitTextStroke: "1.5px rgba(0,0,0,0.15)", lineHeight: 1 }}>
            &bull;VIBE&nbsp;CODING&nbsp;DESIGN&nbsp;SOUND
          </span>
        </div>
      </div>
    </div>
  )
}


const REVEAL_TEXT = "Engineered for DJs who demand perfection in every set. The complete ecosystem, crafted to perform without compromise, built to last without question."

function ScrollTextReveal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setupSec = SCROLL_SECTIONS.setup_reveal as { start: number; end: number }
  const words = useMemo(() => REVEAL_TEXT.split(" "), [])

  useEffect(() => {
    const unsub = useScrollStore.subscribe((state) => {
      if (!containerRef.current) return
      const p = state.progress
      if (p < setupSec.start - 0.02 || p > setupSec.end + 0.02) return

      const sp = Math.max(0, Math.min(1, (p - setupSec.start) / (setupSec.end - setupSec.start)))
      const fadeIn = Math.min(1, sp / 0.06)
      const fadeOut = sp > 0.92 ? Math.max(0, 1 - (sp - 0.92) / 0.08) : 1
      containerRef.current.style.opacity = String(fadeIn * fadeOut)

      const paintStart = 0.05
      const paintEnd = 0.88
      const paintRange = paintEnd - paintStart
      const wordEls = containerRef.current.querySelectorAll<HTMLSpanElement>("[data-word]")
      wordEls.forEach((el, i) => {
        const threshold = paintStart + (i / (words.length - 1)) * paintRange
        const wordProgress = Math.max(0, Math.min(1, (sp - threshold) / 0.08))
        const r = Math.round(42 + (255 - 42) * wordProgress)
        const g = Math.round(42 + (255 - 42) * wordProgress)
        const b = Math.round(42 + (255 - 42) * wordProgress)
        el.style.color = `rgb(${r},${g},${b})`
      })
    })
    return unsub
  }, [setupSec.start, setupSec.end, words.length])

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none px-8 md:px-20 lg:px-32" ref={containerRef} style={{ opacity: 0 }}>
      <p className="text-center text-5xl md:text-3xl lg:text-5xl font-inter font-medium leading-[1.5] tracking-tight max-w-4xl">
        {words.map((word, i) => (
          <React.Fragment key={i}>
            <span data-word style={{ color: "rgb(42,42,42)", transition: "color 0.1s ease-out" }}>{word}</span>
            {i < words.length - 1 && " "}
          </React.Fragment>
        ))}
      </p>
    </div>
  )
}


function MixerVisibilityCuller(props: any) {
  const isVisible = useScrollStore((s) => {
    const brandSec = SCROLL_SECTIONS.tt_brand_focus as { start: number; end: number }
    const mxIntroSec = SCROLL_SECTIONS.mx_intro as { start: number; end: number }
    const outroSec = SCROLL_SECTIONS.outro as { start: number; end: number }

    if (s.progress < brandSec.start) return true
    if (s.progress >= mxIntroSec.start - 0.15) return true

    return false
  })

  if (!isVisible) return null

  return <MixerV0X3D {...props} />
}


function HeroTowers3D() {
  const ttTowerGroupRef = useRef<THREE.Group>(null)
  const mxTowerGroupRef = useRef<THREE.Group>(null)


  const towerHeight = 15
  const ttTowerY = 0 - (towerHeight / 2) - 0.01

  const ttTowerTopY = (ttTowerY - 0.57) + (towerHeight / 2)

  useFrame((_, delta) => {
    const p = useScrollStore.getState().progress

    const ttDetailEnd = (SCROLL_SECTIONS.tt_detail as any).end
    const mxIntroStart = (SCROLL_SECTIONS.mx_intro as any).start
    const mxDetailEnd = (SCROLL_SECTIONS.mx_detail as any).end

    const isVisible = p <= ttDetailEnd || (p >= mxIntroStart && p <= mxDetailEnd)

    if (ttTowerGroupRef.current) {
      ttTowerGroupRef.current.visible = isVisible
      if (isVisible) {
        ttTowerGroupRef.current.position.y = THREE.MathUtils.damp(ttTowerGroupRef.current.position.y, 0, 2.5, delta)
      }
    }

    if (mxTowerGroupRef.current) {
      mxTowerGroupRef.current.visible = isVisible
      if (isVisible) {
        mxTowerGroupRef.current.position.y = THREE.MathUtils.damp(mxTowerGroupRef.current.position.y, 0, 3.5, delta)
      }
    }
  })

  return (
    <group>
      <group ref={ttTowerGroupRef}>

        <mesh position={[-0.25, ttTowerY - 0.57, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[8.5, towerHeight, 4]} />
          <meshStandardMaterial color="#000000" roughness={0.6} metalness={0.15} />
        </mesh>

        <mesh position={[-0.25, ttTowerTopY + 0.002, 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8.5, 4]} />
          <shadowMaterial transparent opacity={0.65} />
        </mesh>

        <ContactShadows
          position={[0, ttTowerTopY + 0.003, 0]}
          opacity={0.65}
          scale={12}
          blur={1.5}
          far={5}
          frames={1}
          resolution={512}
          color="#000000"
        />
      </group>

      <group ref={mxTowerGroupRef}>
      </group>
    </group>
  )
}


function HeroBackgroundText() {
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const footerTextsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const heroSec = SCROLL_SECTIONS.hero as { start: number; end: number }
    const outroSec = SCROLL_SECTIONS.outro as { start: number; end: number }

    const unsub = useScrollStore.subscribe((state) => {
      const t = Math.max(0, Math.min(1, state.progress / (heroSec.end * 0.7)))
      const eased = easeInOutCubic(t)

      const tOutro = state.progress < outroSec.start ? 0 : Math.min(1, (state.progress - outroSec.start) / (outroSec.end - outroSec.start))
      const easedOutro = easeInOutCubic(tOutro)

      const currentScale = (1 - eased * 0.92) + (easedOutro * 1)
      const currentTx = (eased * -44) + (easedOutro * 44)
      const currentTy = (-20 + eased * -24) + (easedOutro * 79)
      const subtitleOpacity = Math.max(0, 1 - t * 4)

      if (h1Ref.current) {
        h1Ref.current.style.transform = `translate3d(${currentTx}vw, ${currentTy}vh, 0) scale(${currentScale})`
      }

      if (containerRef.current) {
        if (state.progress >= outroSec.start - 0.05) {
          containerRef.current.style.zIndex = "36"
        } else {
          containerRef.current.style.zIndex = "10"
        }
      }

      if (subtitleRef.current) {
        subtitleRef.current.style.opacity = String(subtitleOpacity)
        subtitleRef.current.style.display = subtitleOpacity > 0 ? '' : 'none'
      }
      if (footerTextsRef.current) {
        footerTextsRef.current.style.opacity = String(easedOutro)
        footerTextsRef.current.style.transform = `translate3d(0, ${(1 - easedOutro) * 20}px, 0)`
      }
    })
    return unsub
  }, [])

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <h1 ref={h1Ref} className="font-zen-dots text-white select-none tracking-tight will-change-transform" style={{ fontSize: '14vw', transform: 'translate3d(0, -15vh, 0) scale(1)', transformOrigin: 'center center' }}>V0X3D</h1>
      </div>
      <div ref={subtitleRef} className="fixed bottom-16 left-0 right-0 z-[10] flex justify-center pointer-events-none">
        <p className="text-sm tracking-[0.3em] uppercase text-white/50 font-light">DESIGN // VIBE // SOUND</p>
      </div>
      <div ref={footerTextsRef} className="fixed bottom-0 left-0 right-0 z-[55] pointer-events-none flex justify-between items-end px-6 pb-6 md:px-12 md:pb-12 will-change-[opacity,transform]" style={{ opacity: 0 }}>
        <div className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] text-white/50 font-medium max-w-[2000px] md:max-w-none">
          © 2026 ALL RIGHTS RESERVED
        </div>
        <div className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold text-right max-w-[150px] md:max-w-none">
          <a href="https://v0.app/@tulioportela" target="_blank" rel="noopener noreferrer" className="pointer-events-auto hover:text-white/80 transition-colors">// BY KISHORE P</a>
        </div>
      </div>
    </>
  )
}


function DynamicBackground() {
  const bgRef = useRef<HTMLDivElement>(null)
  const activeThemeId = useThemeGalleryStore((s) => s.activeThemeId)
  const activeTheme = useMemo(() => THEMES.find(t => t.id === activeThemeId) || THEMES[0], [activeThemeId])

  useEffect(() => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    }

    const unsub = useScrollStore.subscribe((state) => {
      if (!bgRef.current) return
      const p = state.progress

      const customizeSec = SCROLL_SECTIONS.customize as any
      const philosophySec = SCROLL_SECTIONS.philosophy as any
      const showroomSec = SCROLL_SECTIONS.showroom as any

      const colorStart = { r: 232, g: 232, b: 232 }
      const themeRgb = hexToRgb(activeTheme.chassisColor)
      const colorEnd = {
        r: Math.round(themeRgb.r * 0.5 + 255 * 0.5),
        g: Math.round(themeRgb.g * 0.5 + 255 * 0.5),
        b: Math.round(themeRgb.b * 0.5 + 255 * 0.5)
      }

      let r, g, b;

      if (p <= philosophySec.start) {
        r = colorStart.r; g = colorStart.g; b = colorStart.b;
      }
      else if (p > philosophySec.start && p < showroomSec.start) {
        const range = showroomSec.start - philosophySec.start;
        const localP = (p - philosophySec.start) / range;
        const easeP = THREE.MathUtils.smoothstep(localP, 0, 1);

        r = Math.round(THREE.MathUtils.lerp(colorStart.r, colorEnd.r, easeP));
        g = Math.round(THREE.MathUtils.lerp(colorStart.g, colorEnd.g, easeP));
        b = Math.round(THREE.MathUtils.lerp(colorStart.b, colorEnd.b, easeP));
      }
      else {
        r = colorEnd.r; g = colorEnd.g; b = colorEnd.b;
      }

      bgRef.current.style.backgroundColor = `rgb(${r},${g},${b})`
    })
    return unsub
  }, [activeTheme])

  return (
    <div
      ref={bgRef}
      className="fixed inset-0 -z-10 will-change-[background-color]"
      style={{ backgroundColor: 'rgb(232, 232, 232)' }}
    />
  )
}



function SceneManager() {
  const ttGroupRef = useRef<THREE.Group>(null)
  const mxGroupRef = useRef<THREE.Group>(null)
  const tt2GroupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<any>(null)
  const currentCamTarget = useMemo(() => new THREE.Vector3(), [])
  const { camera } = useThree()
  const isInteracting = useRef(false)
  const showroomGroupRef = useRef<THREE.Group>(null)

  const explosionFactorRef = useRef(0)
  const mxExplosionFactorRef = useRef(0)
  const _ttVec = useMemo(() => new THREE.Vector3(), [])
  const _mxVec = useMemo(() => new THREE.Vector3(), [])
  const _camVec = useMemo(() => new THREE.Vector3(), [])
  const _focusTargetVec = useMemo(() => new THREE.Vector3(), [])
  const _showroomVec = useMemo(() => new THREE.Vector3(), [])

  const blendedStateRef = useRef({ camPos: [0, 0, 0], camTarget: [0, 0, 0], fov: 0, ttPos: [0, 0, 0], mxPos: [0, 0, 0], showroomPos: [0, 0, 0] })
  const isShowroomActive = useScrollStore((s) => s.progress >= SCROLL_SECTIONS.showroom.start && s.progress <= SCROLL_SECTIONS.showroom.end + 0.02)
  const isThemeGalleryVisible = useScrollStore((s) => s.progress >= SCROLL_SECTIONS.showroom.start - 0.02 && s.progress <= SCROLL_SECTIONS.gallery.start)

  const activeThemeId = useThemeGalleryStore((s) => s.activeThemeId)
  const activeTheme = useMemo(() => THEMES.find(t => t.id === activeThemeId) || THEMES[0], [activeThemeId])

  const storeChassisColor = useScrollStore((s) => s.chassisColor)
  const storeHardwareFinish = useScrollStore((s) => s.hardwareFinish)
  const storeVinylColor = useScrollStore((s) => s.vinylColor)
  const storeMixerColor = useScrollStore((s) => s.mixerColor)
  const storeGlossyTop = useScrollStore((s) => s.showGlossyTop)
  const storeFaceplate = useScrollStore((s) => s.showFaceplate)

  const chassisColor = isShowroomActive ? activeTheme.chassisColor : storeChassisColor
  const hardwareFinish = isShowroomActive ? activeTheme.hardwareFinish : storeHardwareFinish
  const vinylColor = isShowroomActive ? activeTheme.vinylColor : storeVinylColor
  const mixerColor = isShowroomActive ? activeTheme.chassisColor : storeMixerColor
  const mixerGlossy = isShowroomActive ? activeTheme.glossy : storeGlossyTop
  const mixerFaceplate = isShowroomActive ? activeTheme.faceplate : storeFaceplate
  const mixerPads = isShowroomActive ? activeTheme.pads : undefined

  const { powerOn, startOn, togglePower, toggleStart, tick } = useInteractionStore()

  const smoothedProgress = useRef(0)

  const updateBlendedState = (p: number) => {
    const keys = Object.keys(SCROLL_SECTIONS)
    const sections = SCROLL_SECTIONS as Record<string, { start: number; end: number }>
    let startIndex = 0
    for (let i = 0; i < keys.length; i++) { if (p >= sections[keys[i]].start) startIndex = i }
    const endIndex = Math.min(startIndex + 1, keys.length - 1)
    const startKey = keys[startIndex]; const endKey = keys[endIndex]
    const startState = SCENE_STATES[startKey] || SCENE_STATES.neutral
    const endState = SCENE_STATES[endKey] || SCENE_STATES.neutral
    const currentEnd = sections[startKey].end; const nextStart = sections[endKey].start
    const b = blendedStateRef.current;
    if (p <= currentEnd) { for (let i = 0; i < 3; i++) { b.camPos[i] = startState.camPos[i]; b.camTarget[i] = startState.camTarget[i]; b.ttPos[i] = startState.ttPos[i]; b.mxPos[i] = startState.mxPos[i]; b.showroomPos[i] = startState.showroomPos[i]; } b.fov = startState.fov; return; }
    const gapP = THREE.MathUtils.clamp((p - currentEnd) / (nextStart - currentEnd), 0, 1); const easeP = easeInOutCubic(gapP)
    for (let i = 0; i < 3; i++) { b.camPos[i] = lerp(startState.camPos[i], endState.camPos[i], easeP); b.camTarget[i] = lerp(startState.camTarget[i], endState.camTarget[i], easeP); b.ttPos[i] = lerp(startState.ttPos[i], endState.ttPos[i], easeP); b.mxPos[i] = lerp(startState.mxPos[i], endState.mxPos[i], easeP); b.showroomPos[i] = lerp(startState.showroomPos[i], endState.showroomPos[i], easeP); }
    b.fov = lerp(startState.fov, endState.fov, easeP)
  }

  useFrame((state, delta) => {
    const targetProgress = useScrollStore.getState().progress
    smoothedProgress.current = THREE.MathUtils.damp(smoothedProgress.current, targetProgress, 6, delta)
    const p = smoothedProgress.current;
    updateBlendedState(p);
    const blended = blendedStateRef.current;
    const customizeSec2 = SCROLL_SECTIONS.customize as any
    const showroomSec2 = SCROLL_SECTIONS.showroom as any
    const gallerySec = SCROLL_SECTIONS.gallery as any
    const isShowroomTransition = p > customizeSec2.end && p <= showroomSec2.end
    const lerpBase = isShowroomTransition ? 0.001 : 0.0001
    const lerpSpeed = 1 - Math.pow(lerpBase, delta)

    const calcExplosion = (prog: number, sec: any) => {
      if (!sec || prog < sec.start || prog > sec.end + 0.02) return 0
      const localP = (prog - sec.start) / (sec.end - sec.start)
      if (localP < 0.25) return easeInOutCubic(localP / 0.25)
      if (localP < 0.85) return 1
      return easeInOutCubic((1 - localP) / 0.15)
    }
    explosionFactorRef.current = calcExplosion(p, SCROLL_SECTIONS.exploded)
    mxExplosionFactorRef.current = calcExplosion(p, SCROLL_SECTIONS.mx_exploded)
    tick(delta)

    let finalTtPos = blended.ttPos;
    let finalMxPos = blended.mxPos;
    let finalTt2Pos = [0, -40, 0];

    let stickyOffsetY = 0;

    const isCustomize = p >= customizeSec2.start && p <= customizeSec2.end;
    const philosophySec = SCROLL_SECTIONS.philosophy as any;
    const isPhilosophy = p >= philosophySec.start && p <= philosophySec.end;
    const isOutro = p >= (SCROLL_SECTIONS.outro as any).start - 0.02;

    const exitStart = showroomSec2.end - 0.04;
    const exitEnd = gallerySec.start + 0.01;

    if (p > exitStart && p < (SCROLL_SECTIONS.outro as any).start - 0.05) {
      if (p <= exitEnd) {
        const localP = (p - exitStart) / (exitEnd - exitStart);
        const easeOut = easeInOutCubic(localP);

        stickyOffsetY = easeOut * 6.5;
      } else {
        stickyOffsetY = 6.5;
      }
    }

    if (isCustomize) {
      if (useScrollStore.getState().activeCustomizer === "mixer") { finalTtPos = [-30, 0, 0]; finalMxPos = [1.2, 0, 0]; }
      else { finalTtPos = [1.2, 0, 0]; finalMxPos = [30, 0, 0]; }
    }

    if (p > showroomSec2.end && p < gallerySec.start - 0.02) {
      finalTtPos = [-30, 0, 0];
      finalMxPos = [30, 0, 0];
    }

    let targetTtRotY = 0, targetTtRotX = 0;
    let targetMxRotY = 0, targetMxRotX = 0;
    let targetTt2RotY = 0;

    if (isOutro) {
      finalTtPos = [-3.1, -0.01, 0];
      finalMxPos = [0, 0.03, 0.4];
      finalTt2Pos = [3.1, -0.01, 0];

      targetTtRotY = Math.PI / 2;
      targetTt2RotY = Math.PI / 2;
    }
    else if (isPhilosophy) {
      targetTtRotY = 0.55;
      targetTtRotX = 0.25;
      targetMxRotY = -0.55;
      targetMxRotX = 0.25;
    }
    else {
      const brandSec = SCROLL_SECTIONS.tt_brand_focus as any;
      if (p >= brandSec.start - 0.1 && p <= brandSec.end + 0.1) {
        targetTtRotY = THREE.MathUtils.clamp((p - brandSec.start) / (brandSec.end - brandSec.start), 0, 1) * Math.PI * 2;
      }
    }

    if (ttGroupRef.current) {
      ttGroupRef.current.rotation.y = THREE.MathUtils.damp(ttGroupRef.current.rotation.y, targetTtRotY, 4, delta);
      ttGroupRef.current.rotation.x = THREE.MathUtils.damp(ttGroupRef.current.rotation.x, targetTtRotX, 4, delta);
    }
    if (tt2GroupRef.current) {
      tt2GroupRef.current.visible = p >= (SCROLL_SECTIONS.gallery as any).start;
      tt2GroupRef.current.rotation.y = THREE.MathUtils.damp(tt2GroupRef.current.rotation.y, targetTt2RotY, 4, delta);
      tt2GroupRef.current.rotation.x = THREE.MathUtils.damp(tt2GroupRef.current.rotation.x, targetTtRotX, 4, delta);
    }
    if (mxGroupRef.current) {
      mxGroupRef.current.rotation.y = THREE.MathUtils.damp(mxGroupRef.current.rotation.y, targetMxRotY, 4, delta);
      mxGroupRef.current.rotation.x = THREE.MathUtils.damp(mxGroupRef.current.rotation.x, targetMxRotX, 4, delta);
    }

    if (controlsRef.current) {
      const isExplodedActive = (p >= (SCROLL_SECTIONS.exploded as any).start && p <= (SCROLL_SECTIONS.exploded as any).end) || (p >= (SCROLL_SECTIONS.mx_exploded as any).start && p <= (SCROLL_SECTIONS.mx_exploded as any).end);
      controlsRef.current.enableRotate = isExplodedActive || isOutro;
    }

    if (!isInteracting.current) {
      currentCamTarget.lerp(_focusTargetVec.fromArray(blended.camTarget), lerpSpeed)
      camera.position.lerp(_camVec.fromArray(blended.camPos), lerpSpeed)
      camera.fov = lerp(camera.fov, blended.fov, lerpSpeed)
      if (controlsRef.current) { controlsRef.current.target.copy(currentCamTarget); controlsRef.current.update() }
      camera.updateProjectionMatrix()
    }

    const isFinalSetup = p >= gallerySec.start - 0.05;
    if (isFinalSetup) {
      if (ttGroupRef.current) {
        _ttVec.fromArray(finalTtPos);
        _ttVec.y += stickyOffsetY;
        ttGroupRef.current.position.copy(_ttVec);
      }
      if (tt2GroupRef.current) tt2GroupRef.current.position.fromArray(finalTt2Pos);
      if (mxGroupRef.current) {
        _mxVec.fromArray(finalMxPos);
        _mxVec.y += stickyOffsetY;
        mxGroupRef.current.position.copy(_mxVec);
      }
    }
    else {
      if (ttGroupRef.current) {
        _ttVec.fromArray(finalTtPos);
        _ttVec.y += stickyOffsetY;
        ttGroupRef.current.position.lerp(_ttVec, lerpSpeed);
      }
      if (tt2GroupRef.current) tt2GroupRef.current.position.lerp(_ttVec.fromArray(finalTt2Pos), lerpSpeed);
      if (mxGroupRef.current) {
        _mxVec.fromArray(finalMxPos);
        _mxVec.y += stickyOffsetY;
        mxGroupRef.current.position.lerp(_mxVec, lerpSpeed);
      }
    }

  })

  const isOutro = useScrollStore((s) => s.progress >= SCROLL_SECTIONS.outro.start - 0.02);
  const effectivePowerOn = isOutro ? powerOn : false;
  const effectiveStartOn = isOutro ? (powerOn && startOn) : false;
  const turntableSpeed = effectiveStartOn ? 0.8 : 0;
  const armAngle = effectiveStartOn ? -0.35 : 0;

  return (
    <>
      <group ref={ttGroupRef} rotation={[0, 0, 0]}>
        <TurntableModel
          chassisColor={chassisColor}
          explosionFactorRef={explosionFactorRef}
          hardwareFinish={hardwareFinish}
          vinylColor={vinylColor}
          powerOn={effectivePowerOn}
          currentSpeed={turntableSpeed}
          tonearmAngle={armAngle}
          onTogglePower={isOutro ? togglePower : undefined}
          onToggleStart={isOutro ? toggleStart : undefined}
        />
      </group>

      <group ref={tt2GroupRef} rotation={[0, 0, 0]}>
        <TurntableModel
          chassisColor={chassisColor}
          explosionFactorRef={explosionFactorRef}
          hardwareFinish={hardwareFinish}
          vinylColor={vinylColor}
          powerOn={effectivePowerOn}
          currentSpeed={turntableSpeed}
          tonearmAngle={armAngle}
          onTogglePower={isOutro ? togglePower : undefined}
          onToggleStart={isOutro ? toggleStart : undefined}
        />
      </group>

      <group ref={mxGroupRef} rotation={[0, 0, 0]} >
        <MixerVisibilityCuller
          explosionFactorRef={mxExplosionFactorRef}
          chassisColorOverride={isShowroomActive ? mixerColor : undefined}
          showGlossyTopOverride={isShowroomActive ? mixerGlossy : undefined}
          showFaceplateOverride={isShowroomActive ? mixerFaceplate : undefined}
          padColorOverrides={mixerPads}
        />
      </group>

      <group ref={showroomGroupRef} visible={isThemeGalleryVisible}>
        <ThemeGallery3D />
      </group>

      {/*
      <group position={[0, 0.38, -0.33]}>
        <DJSetupCables visible={isOutro} />
      </group>
      */}

      <HeroTowers3D />
      <MasterLightingManager />

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.5}
        minAzimuthAngle={-Math.PI}
        maxAzimuthAngle={Math.PI}
        makeDefault
        onStart={() => { isInteracting.current = true }}
        onEnd={() => { setTimeout(() => { isInteracting.current = false }, 2000) }}
      />
    </>
  )
}


export default function TurntablePage() {
  return (
    <main className="relative h-[2400vh] overflow-x-hidden">
      <LoadingScreen />
      <ScrollHandler />
      <DynamicBackground />
      <HeroBackgroundText />
      <div className="fixed inset-0 z-0">
        <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundColor: '#080808' }} />
        </div>
        <BrandFocusOverlay />
      </div>

      <div className="fixed inset-0 z-20 pointer-events-none">
        <Canvas shadows="soft" dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9 }} className="pointer-events-auto">
          <SceneFog />

          <Suspense fallback={null}>
            <TurntableGeometryProvider>
              <SceneManager />
            </TurntableGeometryProvider>
          </Suspense>

          <EffectComposer disableNormalPass={true}>
            <Vignette offset={0.35} darkness={0.75} />
          </EffectComposer>

        </Canvas>
      </div>

      <SectionContentImproved />
      <ScrollTextReveal />
      <HorizontalGallery />
      <BentoCards />
      <PhilosophySection />
      <ThemeGalleryUI />

      <BlackoutOverlay />
      <BulletPointsOverlay />
      <DragRing />
      <ColorPickerPremium />

      {/* <ScrollProgress /> */}
    </main>
  )
}




function CableConnector({ position, type, rotation = [0, 0, 0] }: { position: number[], type: "red" | "white" | "power", rotation?: number[] }) {
  const ringColor = type === "red" ? "#B71C1C" : "#e8e8e8"

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[rotation[0], rotation[1], rotation[2]]}>

      {type === "power" ? (
        <>
          <mesh position={[0, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 24]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, -0.045]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.02, 0.03, 16]} />
            <meshStandardMaterial color="#050505" roughness={0.9} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0, -0.002]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.02, 32]} />
            <meshStandardMaterial color={ringColor} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.032]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.04, 32]} />
            <meshStandardMaterial color="#111111" roughness={0.7} metalness={0.1} />
          </mesh>
        </>
      )}
    </group>
  )
}
function ThickCable({
  start, end, color, radius = 0.006, type = "red",
  floorY = -1.95,
  floorZOffset = -0.8
}: any) {

  const curve = useMemo(() => {
    const p0 = new THREE.Vector3(...start);
    const p7 = new THREE.Vector3(...end);


    const p1 = new THREE.Vector3(p0.x, p0.y, p0.z - 0.15);
    const p6 = new THREE.Vector3(p7.x, p7.y, p7.z - 0.12);

    const midX = (p0.x + p7.x) / 2;
    const deepestZ = Math.min(p0.z, p7.z) + floorZOffset;

    const p2 = new THREE.Vector3(p0.x, (p0.y + floorY) / 1.9, p0.z - 0.5);
    const p5 = new THREE.Vector3(p7.x, (p7.y + floorY) / 1.9, p7.z - 0.3);

    const p3 = new THREE.Vector3(p0.x * 0.4 + midX * 0.6, floorY, deepestZ);
    const p_mid = new THREE.Vector3(midX, floorY, deepestZ);
    const p4 = new THREE.Vector3(p7.x * 0.4 + midX * 0.6, floorY, deepestZ);

    return new THREE.CatmullRomCurve3([p0, p1, p2, p3, p_mid, p4, p5, p6, p7], false, "centripetal", 0.3);
  }, [start, end, floorY, floorZOffset]);

  return (
    <group>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 128, radius, 12, false]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      <CableConnector position={start} type={type} />
      <CableConnector position={end} type={type} />
    </group>
  );
}
function DJSetupCables({ visible }: { visible: boolean }) {
  if (!visible) return null


  const hWhiteLeft = -0.96; const zWhiteLeft = -0.35;
  const hRedLeft = -0.93; const zRedLeft = -0.3;
  const hPowerLeft = -0.999; const zPowerLeft = -0.25;

  const hWhiteRight = -0.94; const zWhiteRight = -0.55;
  const hRedRight = -0.92; const zRedRight = -0.80;
  const hPowerRight = -0.98; const zPowerRight = -0.15;

  return (
    <group>
      {/* ============================================================== */}
      {/* TT1 (ESQUERDO) */}
      {/* ============================================================== */}
      <ThickCable
        start={[0.319, -0.586, -1.213]} end={[-3.67, -0.651, -1.88]}
        color="#111111" type="white" radius={0.022}
        floorY={hWhiteLeft} floorZOffset={zWhiteLeft}
      />
      <ThickCable
        start={[0.165, -0.696, -1.213]} end={[-3.43, -0.651, -1.88]}
        color="#B71C1C" type="red" radius={0.022}
        floorY={hRedLeft} floorZOffset={zRedLeft}
      />
      <ThickCable
        start={[-0.638, -0.542, -1.213]} end={[-3.05, -0.641, -1.870]}
        color="#111111" radius={0.025} type="power"
        floorY={hPowerLeft} floorZOffset={zPowerLeft}
      />

      {/* ============================================================== */}
      {/* TT2 (DIREITO) */}
      {/* ============================================================== */}
      <ThickCable
        start={[-0.913, -0.586, -1.213]} end={[2.53, -0.651, -1.88]}
        color="#e8e8e8" type="white" radius={0.022}
        floorY={hWhiteRight} floorZOffset={zWhiteRight}
      />
      <ThickCable
        start={[-1.023, -0.718, -1.213]} end={[2.77, -0.651, -1.863]}
        color="#111111" type="red" radius={0.022}
        floorY={hRedRight} floorZOffset={zRedRight}
      />
      <ThickCable
        start={[0.6, -0.78, -1.213]} end={[3.145, -0.65, -1.87]}
        color="#111111" radius={0.025} type="power"
        floorY={hPowerRight} floorZOffset={zPowerRight}
      />
    </group>
  )
}
