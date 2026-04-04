// mixer-3d.tsx

"use client"

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"

import * as THREE from "three"
import { useInteractionStore } from "@/lib/interaction-store"

// ================================================================================
// SHARED GEOMETRIES & MATERIALS (created once, reused everywhere)
// ================================================================================
import { usePBRTextures } from "@/lib/textures"
import { useScrollStore } from "@/lib/scroll-store"
import { MixerChassisMaterial } from "@/lib/materials"



const sharedGeo = {
  knobBase: new THREE.CylinderGeometry(0.028, 0.032, 0.008, 32),
  knobMid: new THREE.CylinderGeometry(0.027, 0.032, 0.02, 32),
  knobTop: new THREE.CylinderGeometry(0.022, 0.025, 0.035, 32),
  knurling: new THREE.BoxGeometry(0.005, 0.022, 0.005),
  knobCap: new THREE.SphereGeometry(0.019, 24, 18),
  knobIndicator: new THREE.BoxGeometry(0.004, 0.004, 0.02),
  gaugeDot: new THREE.CircleGeometry(0.004, 8),
  ventBar: new THREE.BoxGeometry(0.01, 0.25, 0.02),
  faderTick: new THREE.PlaneGeometry(0.18, 0.004),
  label: new THREE.PlaneGeometry(1, 1), // escala dinâmica via aspect ratio
  // Equivalentes ao RoundedBox
  cueBtn: new THREE.BoxGeometry(0.14, 0.025, 0.1),
  switchBase: new THREE.BoxGeometry(0.1, 0.01, 0.08),
  switchToggle: new THREE.BoxGeometry(0.08, 0.02, 0.05),
  navBtnBase: new THREE.BoxGeometry(0.3, 0.02, 0.12),
  navBtnTop: new THREE.BoxGeometry(0.28, 0.025, 0.1),
  vuMeterShell: new THREE.BoxGeometry(0.26, 0.01, 0.7),
  vuMeterGlass: new THREE.BoxGeometry(0.23, 0.004, 0.65),
  faderCapBody: new THREE.BoxGeometry(0.22, 0.13, 0.085),
  faderCapFace: new THREE.BoxGeometry(0.21, 0.13, 0.012),
}

const sharedMat = {
  knobBase: new THREE.MeshPhysicalMaterial({ color: "#050505", metalness: 0.8, roughness: 0.5 }),
  knobMid: new THREE.MeshPhysicalMaterial({ color: "#0a0a0a", metalness: 0.6, roughness: 0.65 }),
  knobTop: new THREE.MeshPhysicalMaterial({ color: "#080808", roughness: 0.5, metalness: 0.1 }),
  knurling: new THREE.MeshPhysicalMaterial({ color: "#080808", metalness: 0.1, roughness: 0.8 }),
  knobCapBlack: new THREE.MeshPhysicalMaterial({ color: "#1a1a1a", metalness: 0.1, roughness: 1 }),
  indicator: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
  gaugeDot: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.6 }),
  ventBar: new THREE.MeshStandardMaterial({ color: "#000000", roughness: 1 }),
  switchBase: new THREE.MeshStandardMaterial({ color: "#050505" }),
  switchToggle: new THREE.MeshStandardMaterial({ color: "#222222", roughness: 0.3, metalness: 0.2 }),
  navBtnBase: new THREE.MeshStandardMaterial({ color: "#111111" }),
  navBtnTop: new THREE.MeshStandardMaterial({ color: "#2b2b2b", roughness: 0.3, metalness: 0.2 }),
  vuMeterShell: new THREE.MeshStandardMaterial({ color: "#050505", roughness: 0.8 }),
  vuMeterGlass: new THREE.MeshPhysicalMaterial({ color: "#101010", roughness: 0.1, metalness: 0.8, opacity: 0.4, transparent: true }),

  // ======== ATUALIZADOS AQUI ========
  // 1. Riscos do trilho: Mais brancos, mais opacos e com depthWrite false para nunca "afundarem" na malha de baixo
  faderTick: new THREE.MeshBasicMaterial({ color: "#dddddd", transparent: true, opacity: 0.1, depthWrite: false }),
  // 2. Corpo do fader: Quase preto total (de #1a1a1a para #050505) com menos reflexo fosco
  faderCapBody: new THREE.MeshPhysicalMaterial({ color: "#050505", roughness: 0.5, metalness: 0.1 }),
  // 3. Fita do topo: Branca e emissiva (brilhante) para destacar bem
  faderCapFace: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.4 }),
}

// ================================================================================
// CANVAS LABEL — OTIMIZADO COM LRU CACHE PARA PREVENIR MEMORY LEAKS
// ================================================================================
const MAX_MIXER_CACHE_SIZE = 120;
const labelTextureCache = new Map<string, { tex: THREE.CanvasTexture, aspect: number }>()
const measureCtx = typeof document !== 'undefined' ? document.createElement("canvas").getContext("2d") : null;

function getOrCreateLabelTexture(text: string, color: string): { tex: THREE.CanvasTexture, aspect: number } {
  const key = `${text}_${color}`

  if (labelTextureCache.has(key)) {
    const cached = labelTextureCache.get(key)!;
    labelTextureCache.delete(key);
    labelTextureCache.set(key, cached);
    return cached;
  }

  if (labelTextureCache.size >= MAX_MIXER_CACHE_SIZE) {
    const firstKey = labelTextureCache.keys().next().value;
    const oldEntry = labelTextureCache.get(firstKey);
    oldEntry?.tex.dispose(); // Libera a textura da GPU
    labelTextureCache.delete(firstKey);
  }

  const fontSizePx = 54;
  const fontStr = `bold ${fontSizePx}px -apple-system, Helvetica, Arial, sans-serif`

  let textWidth = text.length * 30;
  if (measureCtx) {
    measureCtx.font = fontStr
    textWidth = measureCtx.measureText(text).width
  }

  const H = 72;
  const W = Math.max(H, Math.ceil(textWidth + 24));

  const canvas = document.createElement("canvas")
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, W, H)

  ctx.fillStyle = color
  ctx.font = fontStr
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, W / 2, H / 2 + 4)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace

  // Crie o material AQUI e guarde no cache!
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    toneMapped: false
  })

  const result = { tex, mat, aspect: W / H }
  labelTextureCache.set(key, result)
  return result
}

interface CanvasLabelProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  text: string
  size?: number
  color?: string
}

function CanvasLabel({ position, rotation = [-Math.PI / 2, 0, 0], text, size = 0.025, color = "#AAAAAA" }: CanvasLabelProps) {
  const { mat, aspect } = useMemo(() => getOrCreateLabelTexture(text, color), [text, color])
  return (
    <mesh position={position} rotation={rotation} geometry={sharedGeo.label} scale={[size * aspect, size, 1]}>
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ================================================================================
// MATERIAIS DO MIXER
// ================================================================================

const MxMatChassis = () => <meshStandardMaterial color="#111111" roughness={0.6} metalness={0.4} />
const MxMatFaceplate = () => <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.5} />
const MxMatGlossyTop = () => (
  <meshPhysicalMaterial color="#050505" roughness={0.1} metalness={0.2} clearcoat={1} clearcoatRoughness={0.0} />
)
const MxMatSilverBody = () => (
  <meshPhysicalMaterial color="#e0e0e0" roughness={0.2} metalness={0.9} envMapIntensity={1.2} />
)
const MxMatIndicator = () => <meshBasicMaterial color="#ffffff" toneMapped={false} />
const ChromeMat = () => <meshStandardMaterial color="#E8E8E8" roughness={0.15} metalness={1.0} />

// ================================================================================
// INSTANCED KNOB SYSTEM
// ================================================================================

interface KnobDef {
  worldX: number
  worldZ: number
  scale: number
  label: string
  parentY: number
}

function InstancedKnobBodies({ knobs }: { knobs: KnobDef[] }) {
  const count = knobs.length

  const applyBase = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    knobs.forEach((k, i) => {
      const s = k.scale
      m.compose(new THREE.Vector3(k.worldX, k.parentY + (-0.006) * s, k.worldZ), new THREE.Quaternion(), new THREE.Vector3(s, s, s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [knobs])

  const applyMid = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    knobs.forEach((k, i) => {
      const s = k.scale
      m.compose(new THREE.Vector3(k.worldX, k.parentY, k.worldZ), new THREE.Quaternion(), new THREE.Vector3(s, s, s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [knobs])

  const applyTop = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    knobs.forEach((k, i) => {
      const s = k.scale
      m.compose(new THREE.Vector3(k.worldX, k.parentY + 0.025 * s, k.worldZ), new THREE.Quaternion(), new THREE.Vector3(s, s, s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [knobs])

  return (
    <>
      <instancedMesh ref={applyBase} args={[sharedGeo.knobBase, sharedMat.knobBase, count]} frustumCulled={false} />
      <instancedMesh ref={applyMid} args={[sharedGeo.knobMid, sharedMat.knobMid, count]} frustumCulled={false} />
      <instancedMesh ref={applyTop} args={[sharedGeo.knobTop, sharedMat.knobTop, count]} frustumCulled={false} />
    </>
  )
}

function InstancedKnurling({ knobs }: { knobs: KnobDef[] }) {
  const totalCount = knobs.length * 16

  const applyKnurling = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    let idx = 0
    knobs.forEach((k) => {
      const s = k.scale
      for (let r = 0; r < 16; r++) {
        const angle = (r / 16) * Math.PI * 2
        q.setFromEuler(new THREE.Euler(0, -angle, 0))
        m.compose(
          new THREE.Vector3(k.worldX + Math.cos(angle) * 0.024 * s, k.parentY + 0.025 * s, k.worldZ + Math.sin(angle) * 0.024 * s),
          q,
          new THREE.Vector3(s, s, s)
        )
        mesh.setMatrixAt(idx++, m)
      }
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [knobs])

  return (
    <instancedMesh ref={applyKnurling} args={[sharedGeo.knurling, sharedMat.knurling, totalCount]} frustumCulled={false} />
  )
}

function InstancedKnobCaps({ knobs }: { knobs: KnobDef[] }) {
  const count = knobs.length

  const applyCaps = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    knobs.forEach((k, i) => {
      const s = k.scale
      m.compose(new THREE.Vector3(k.worldX, k.parentY + 0.0418 * s, k.worldZ), new THREE.Quaternion(), new THREE.Vector3(s * 1.103, s * 0.3, s * 1.103))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [knobs])

  return (
    <instancedMesh ref={applyCaps} args={[sharedGeo.knobCap, sharedMat.knobCapBlack, count]} frustumCulled={false} />
  )
}

function InstancedKnobIndicators({ knobs }: { knobs: KnobDef[] }) {
  const count = knobs.length

  const applyIndicators = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    knobs.forEach((k, i) => {
      const s = k.scale
      m.compose(new THREE.Vector3(k.worldX, k.parentY + 0.046 * s, k.worldZ + 0.012 * s), new THREE.Quaternion(), new THREE.Vector3(s, s, s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [knobs])

  return (
    <instancedMesh ref={applyIndicators} args={[sharedGeo.knobIndicator, sharedMat.indicator, count]} frustumCulled={false} />
  )
}

// ================================================================================
// INSTANCED GAUGE DOTS
// ================================================================================

interface GaugeDef {
  worldX: number
  worldZ: number
  scale: number
  parentY: number
  valueRange: [string, string]
}

function InstancedGaugeDots({ gauges }: { gauges: GaugeDef[] }) {
  const points = 11
  const totalCount = gauges.length * points

  const applyDots = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    let idx = 0
    const startAngle = -(Math.PI * 1.25)
    gauges.forEach((g) => {
      const radius = 0.04 * g.scale
      for (let i = 0; i < points; i++) {
        const angle = (i / (points - 1)) * (Math.PI * 1.5) + startAngle
        // Ajustado: altura fixa local de -0.002 para colar na faceplate sem voar
        m.compose(
          new THREE.Vector3(g.worldX + Math.cos(angle) * radius, -0.002, g.worldZ + Math.sin(angle) * radius),
          q,
          new THREE.Vector3(1.5, 1.5, 1.5)
        )
        mesh.setMatrixAt(idx++, m)
      }
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [gauges])

  return (
    <instancedMesh ref={applyDots} args={[sharedGeo.gaugeDot, sharedMat.gaugeDot, totalCount]} frustumCulled={false} />
  )
}

function GaugeLabels({ gauges }: { gauges: GaugeDef[] }) {
  const startAngle = -(Math.PI * 1.25)
  const endAngle = startAngle + Math.PI * 1.5
  return (
    <>
      {gauges.map((g, i) => {
        const labelRadius = 0.035 * g.scale + 0.015 * g.scale
        return (
          <group key={i}>
            <CanvasLabel
              // Ajustado Y = -0.002
              position={[g.worldX + Math.cos(startAngle) * labelRadius, -0.002, g.worldZ + Math.sin(startAngle) * labelRadius]}
              text={String(g.valueRange[0])} size={0.014 * g.scale} color="#ffffff"
            />
            <CanvasLabel
              // Ajustado Y = -0.002
              position={[g.worldX + Math.cos(endAngle) * labelRadius, -0.002, g.worldZ + Math.sin(endAngle) * labelRadius]}
              text={String(g.valueRange[1])} size={0.014 * g.scale} color="#ffffff"
            />
          </group>
        )
      })}
    </>
  )
}

function KnobLabels({ knobs }: { knobs: KnobDef[] }) {
  return (
    <>
      {knobs.map((k, i) =>
        k.label ? (
          <CanvasLabel
            key={i}
            // Ajustado Y = -0.002 desvinculado do parentY dos knobs
            position={[k.worldX, -0.002, k.worldZ + 0.05 * k.scale]}
            text={k.label} size={0.018 * k.scale} color="#ffffff"
          />
        ) : null
      )}
    </>
  )
}

// ================================================================================
// INSTANCED VENT BARS
// ================================================================================

function InstancedVentBars({ positions }: { positions: Array<{ x: number; y: number; z: number }> }) {
  const count = positions.length

  const applyVents = useCallback((mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    positions.forEach((p, i) => {
      m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(1, 1, 1))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [positions])

  return (
    <instancedMesh ref={applyVents} args={[sharedGeo.ventBar, sharedMat.ventBar, count]} frustumCulled={false} />
  )
}



// ================================================================================
// NON-INSTANCED COMPONENTS 
// ================================================================================

function FaderCapPro({ scale = 0.5 }) {
  return (
    <group scale={scale}>
      <mesh geometry={sharedGeo.faderCapBody} material={sharedMat.faderCapBody} position={[0, 0.06, 0]} castShadow />
      <mesh geometry={sharedGeo.faderCapFace} material={sharedMat.faderCapFace} position={[0, 0.065, 0]} />
    </group>
  )
}

function ProFaderMK2({ position, orientation = "vertical", length = 0.9, value = 0.5, interactive = false, onValueChange }: any) {
  const isVertical = orientation === "vertical"
  const [localValue, setLocalValue] = useState(value)
  const sliderPos = (localValue - 0.5) * length
  const isDragging = useRef(false)
  const groupRef = useRef<THREE.Group>(null)
  const planeRef = useRef(new THREE.Plane())
  const intersectPoint = useRef(new THREE.Vector3())
  const { camera, raycaster } = useThree()

  const tickRef = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    if (!tickRef.current) return
    const mat4 = new THREE.Matrix4()
    const quat = new THREE.Quaternion()
    quat.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    for (let i = 0; i < 11; i++) {
      const zPos = (i / 10 - 0.5) * length
      mat4.compose(new THREE.Vector3(0, 0.008, zPos), quat, new THREE.Vector3(1, 1, 1))
      tickRef.current.setMatrixAt(i, mat4)
    }
    tickRef.current.instanceMatrix.needsUpdate = true
  }, [length])

  const handlePointerDown = useCallback((e: any) => {
    if (!interactive) return
    e.stopPropagation()
    isDragging.current = true
      ; (e.target as any).setPointerCapture?.(e.pointerId)
    if (groupRef.current) {
      const worldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPos)
      planeRef.current.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), worldPos)
    }
  }, [interactive])

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging.current || !interactive || !groupRef.current) return
    e.stopPropagation()
    const ndc = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    )
    raycaster.setFromCamera(ndc, camera)
    if (raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current)) {
      const localPt = groupRef.current.worldToLocal(intersectPoint.current.clone())
      const zNorm = (localPt.z / length) + 0.5
      const clamped = Math.max(0, Math.min(1, zNorm))
      setLocalValue(clamped)
      if (onValueChange) onValueChange(clamped)
    }
  }, [interactive, camera, raycaster, length, onValueChange])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
    document.body.style.cursor = 'auto'
  }, [])

  return (
    <group ref={groupRef} position={position} rotation={[0, isVertical ? 0 : Math.PI / 2, 0]}>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.02, 0.005, length]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <instancedMesh ref={tickRef} args={[sharedGeo.faderTick, sharedMat.faderTick, 11]} frustumCulled={false} />
      <group
        position={[0, 0.01, sliderPos]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={(e: any) => { if (interactive) { e.stopPropagation(); document.body.style.cursor = 'grab' } }}
        onPointerOut={() => { if (interactive && !isDragging.current) document.body.style.cursor = 'auto' }}
      >
        <FaderCapPro scale={0.6} />
      </group>
    </group>
  )
}



function MixerHexScrew({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.022, 0.022, 0.01, 18]} />
        <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.4} />
      </mesh>
      <group position={[0, 0.003, 0]}>
        <mesh><boxGeometry args={[0.022, 0.005, 0.006]} /><meshBasicMaterial color="#000" /></mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.022, 0.005, 0.006]} /><meshBasicMaterial color="#000" /></mesh>
      </group>
    </group>
  )
}

function MixerSilverKnob({ position = [0, 0, 0], rotation = 0, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.02, 0]} >
        <cylinderGeometry args={[0.18, 0.2, 0.04, 64]} />
        <ChromeMat />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[0, rotation, 0]} >
        <cylinderGeometry args={[0.16, 0.16, 0.18, 64]} />
        <ChromeMat />
      </mesh>
      <mesh position={[0, 0.21, 0]} >
        <cylinderGeometry args={[0.14, 0.16, 0.02, 64]} />
        <meshStandardMaterial color="#DDD" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 32]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.12, 0.145]} rotation={[0, rotation, 0]}>
        <boxGeometry args={[0.02, 0.16, 0.04]} />
        <meshStandardMaterial color="#000" roughness={0.8} />
      </mesh>
      {/* Ajustado Y = -0.002 para colar na superfície */}
      <CanvasLabel position={[0, -0.002, -0.25]} text="FILTER" size={0.035} color="#CCCCCC" />
    </group>
  )
}

function MixerSwitch({ position, label, options }: { position: [number, number, number]; label: string; options: [string, string] }) {
  return (
    <group position={position}>
      {/* Ajustado Y = -0.002 para colar na superfície */}
      <CanvasLabel position={[0, 0.002, -0.07]} text={label} size={0.02} color="#AAAAAA" />
      <CanvasLabel position={[-0.09, 0.002, 0]} text={options[0]} size={0.025} color="#AAAAAA" />
      <CanvasLabel position={[0.09, 0.002, 0]} text={options[1]} size={0.025} color="#AAAAAA" />
      <mesh geometry={sharedGeo.switchBase} material={sharedMat.switchBase} position={[0, 0.005, 0]} />
      <mesh geometry={sharedGeo.switchToggle} material={sharedMat.switchToggle} position={[0, 0.015, 0]} />
    </group>
  )
}

{/*
  function ButtonSmall({ position, label, options }: { position: [number, number, number]; label: string; options: [string, string] }) {
    return (
      <group position={position}>
        <CanvasLabel position={[0, -0.002, -0.07]} text={label} size={0.02} color="#AAAAAA" />
        <CanvasLabel position={[-0.09, -0.002, 0]} text={options[0]} size={0.025} color="#AAAAAA" />
        <CanvasLabel position={[0.09, -0.002, 0]} text={options[1]} size={0.025} color="#AAAAAA" />
        <mesh geometry={sharedGeo.switchBase} material={sharedMat.switchBase} position={[0, 0.005, 0]} />
        <mesh geometry={sharedGeo.switchToggle} material={sharedMat.switchToggle} position={[0, 0.015, 0]} />
      </group>
    )
  }
*/}

function TopNavButton({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <group position={position}>
      <mesh geometry={sharedGeo.navBtnBase} material={sharedMat.navBtnBase} position={[0, 0.01, 0]} />
      <mesh geometry={sharedGeo.navBtnTop} material={sharedMat.navBtnTop} position={[0, 0.02, 0]} />
      {/* Aqui a altura é 0.033 pois o texto precisa ficar EM CIMA do botão e não na superfície */}
      <CanvasLabel position={[0, 0.033, 0]} text={label} size={0.025} color="#AAAAAA" />
    </group>
  )
}

function VUMeter({ position, vuLevels }: { position: [number, number, number]; vuLevels?: [number, number, number] }) {
  const defaultLevels: [number, number, number] = [8, 11, 6]
  const levels = vuLevels || defaultLevels

  const Led = ({ active, color }: { active: boolean; color: string }) => {
    return active ? (
      <>
        <mesh>
          <boxGeometry args={[0.055, 0.001, 0.025]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.05, 0.001, 0.02]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </>
    ) : (
      <mesh>
        <boxGeometry args={[0.05, 0.001, 0.02]} />
        <meshBasicMaterial color="#101010" />
      </mesh>
    )
  }

  return (
    <group position={position}>
      <mesh geometry={sharedGeo.vuMeterShell} material={sharedMat.vuMeterShell} position={[0, 0.005, 0]} />
      <mesh geometry={sharedGeo.vuMeterGlass} material={sharedMat.vuMeterGlass} position={[0, 0.012, 0]} />
      <group position={[0, 0.009, 0]}>
        {[-0.06, 0, 0.06].map((x, col) => (
          <group key={col} position={[x, 0, 0]}>
            {Array.from({ length: 12 }).map((_, i) => {
              let color = "#00ff00"
              if (i > 7) color = "#ff9900"
              if (i > 10) color = "#ff0000"
              const active = i < levels[col]
              return (
                // Ajustado: LEDs abaixados de 0.015 para 0.002 para repousarem sob o vidro do VUMeter
                <group key={i} position={[0, 0.007, 0.28 - i * 0.05]}>
                  <Led active={active} color={color} />
                </group>
              )
            })}
          </group>
        ))}
      </group>
      {/* Ajustado Y de 0.006 para 0.015 para compensar offset do VU e colar os textos perfeitamente na faceplate */}
      <CanvasLabel position={[-0.065, 0.015, 0.4]} text="1" size={0.025} color="#888888" />
      <CanvasLabel position={[0, 0.015, 0.4]} text="MASTER" size={0.025} color="#888888" />
      <CanvasLabel position={[0.065, 0.015, 0.4]} text="2" size={0.025} color="#888888" />
    </group>
  )
}

// ================================================================================
// REAR PANEL
// ================================================================================

const REAR_COLORS = {
  background: "#1a1a1a", chassisMain: "#222222", chassisPanel: "#151515",
  gold: "#ffd700", silver: "#eeeeee", chrome: "#ffffff",
  blackPlastic: "#080808", whitePlastic: "#dddddd", redPlastic: "#cc0000",
  darkConnector: "#050505", text: "#cccccc",
}
const REAR_MAT_PROPS = {
  chassisMain: { color: REAR_COLORS.chassisMain, roughness: 0.7, metalness: 0.1 },
  chassisPanel: { color: REAR_COLORS.chassisPanel, roughness: 0.6, metalness: 0.2 },
  gold: { color: REAR_COLORS.gold, roughness: 0.15, metalness: 1.0 },
  silver: { color: REAR_COLORS.silver, roughness: 0.25, metalness: 0.95 },
  chrome: { color: REAR_COLORS.chrome, roughness: 0.05, metalness: 1.0 },
  blackPlastic: { color: REAR_COLORS.blackPlastic, roughness: 0.4, metalness: 0.0 },
  whitePlastic: { color: REAR_COLORS.whitePlastic, roughness: 0.4, metalness: 0.0 },
  redPlastic: { color: REAR_COLORS.redPlastic, roughness: 0.3, metalness: 0.0 },
  darkConnector: { color: REAR_COLORS.darkConnector, roughness: 0.8, metalness: 0.0 },
}

const RearLabel = ({ text, size = 0.08, color = REAR_COLORS.text, ...props }: any) => (
  <group {...props}>
    <CanvasLabel position={[0, 0, 0]} rotation={[0, 0, 0]} text={text} size={size} color={color} />
  </group>
)

const RearScrew = (props: any) => (
  <group {...props}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.015, 16]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.blackPlastic} /></mesh>
    <mesh position={[0, 0, 0.008]}><boxGeometry args={[0.03, 0.008, 0.005]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.darkConnector} /></mesh>
    <mesh position={[0, 0, 0.008]}><boxGeometry args={[0.008, 0.03, 0.005]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.darkConnector} /></mesh>
  </group>
)

const RearRCANew = ({ type = "red", ...props }: any) => (
  <group {...props}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.045, 0.045, 0.012, 24]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.blackPlastic} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}><cylinderGeometry args={[0.04, 0.04, 0.04, 24]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.gold} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.022]}><cylinderGeometry args={[0.030, 0.030, 0.042, 24]} /><meshPhysicalMaterial {...(type === "red" ? REAR_MAT_PROPS.redPlastic : REAR_MAT_PROPS.whitePlastic)} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.023]}><cylinderGeometry args={[0.012, 0.012, 0.044, 12]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.blackPlastic} /></mesh>
  </group>
)

const GroundTerminal = (props: any) => (
  <group {...props}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.005]}><cylinderGeometry args={[0.05, 0.05, 0.01, 32]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.blackPlastic} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.025]}><cylinderGeometry args={[0.04, 0.04, 0.035, 32]} /><meshPhysicalMaterial color="#888" roughness={0.3} metalness={0.9} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.045]}><cylinderGeometry args={[0.015, 0.015, 0.04, 16]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.silver} /></mesh>
  </group>
)

const TRSConnector = (props: any) => (
  <group {...props}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.005]}><cylinderGeometry args={[0.065, 0.065, 0.01, 6]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.silver} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.015]}><cylinderGeometry args={[0.045, 0.045, 0.02, 32]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.blackPlastic} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}><cylinderGeometry args={[0.02, 0.02, 0.022, 16]} /><meshPhysicalMaterial {...REAR_MAT_PROPS.gold} /></mesh>
  </group>
)

const USBConnector = (props: any) => (
  <group {...props}>
    <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.13, 0.09, 0.02]} /><meshPhysicalMaterial color="#b0b0b0" roughness={0.2} metalness={0.9} /></mesh>
    <mesh position={[0, 0, 0.015]}><boxGeometry args={[0.11, 0.07, 0.015]} /><meshBasicMaterial color="#000000" /></mesh>
    <mesh position={[0, -0.01, 0.02]}><boxGeometry args={[0.08, 0.025, 0.01]} /><meshStandardMaterial color="#ffffff" roughness={0.5} /></mesh>
  </group>
)

const SectionBorder = ({ width, height, position }: any) => {
  const thickness = 0.003
  return (
    <group position={position}>
      <mesh position={[0, height / 2 - thickness / 2, 0.001]}><boxGeometry args={[width, thickness, 0.001]} /><meshBasicMaterial color="#888888" /></mesh>
      <mesh position={[0, -height / 2 + thickness / 2, 0.001]}><boxGeometry args={[width, thickness, 0.001]} /><meshBasicMaterial color="#888888" /></mesh>
      <mesh position={[-width / 2 + thickness / 2, 0, 0.001]}><boxGeometry args={[thickness, height, 0.001]} /><meshBasicMaterial color="#888888" /></mesh>
      <mesh position={[width / 2 - thickness / 2, 0, 0.001]}><boxGeometry args={[thickness, height, 0.001]} /><meshBasicMaterial color="#888888" /></mesh>
    </group>
  )
}

const XLRFemale = (props: any) => {
  const holePositions = [{ x: 0, y: 0.04 }, { x: -0.035, y: -0.025 }, { x: 0.035, y: -0.025 }]
  return (
    <group {...props}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}><cylinderGeometry args={[0.1, 0.1, 0.025, 32]} /><meshPhysicalMaterial color="#0a0a0a" roughness={0.4} metalness={0.1} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.015]}><cylinderGeometry args={[0.085, 0.085, 0.02, 32]} /><meshPhysicalMaterial color="#555555" roughness={0.3} metalness={0.6} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}><cylinderGeometry args={[0.07, 0.07, 0.03, 32]} /><meshPhysicalMaterial color="#050505" roughness={0.9} /></mesh>
      {holePositions.map((pos, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[pos.x, pos.y, 0.03]}><cylinderGeometry args={[0.012, 0.012, 0.025, 12]} /><meshPhysicalMaterial color="#D4AF37" roughness={0.2} metalness={0.9} /></mesh>
      ))}
      <mesh position={[0, 0.075, 0.015]}><boxGeometry args={[0.025, 0.02, 0.015]} /><meshPhysicalMaterial color="#0a0a0a" roughness={0.4} /></mesh>
    </group>
  )
}

function PowerSwitch({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <group position={[0, 0, 0.01]}>
        <mesh position={[-0.075, 0, 0]}><boxGeometry args={[0.015, 0.16, 0.02]} /><meshStandardMaterial color="#080808" /></mesh>
        <mesh position={[0.075, 0, 0]}><boxGeometry args={[0.015, 0.16, 0.02]} /><meshStandardMaterial color="#080808" /></mesh>
        <mesh position={[0, 0.075, 0]}><boxGeometry args={[0.165, 0.015, 0.02]} /><meshStandardMaterial color="#080808" /></mesh>
        <mesh position={[0, -0.075, 0]}><boxGeometry args={[0.165, 0.015, 0.02]} /><meshStandardMaterial color="#080808" /></mesh>
      </group>
      <mesh position={[-0.055, 0, 0.02]}><boxGeometry args={[0.006, 0.14, 0.01]} /><meshStandardMaterial color="#050505" /></mesh>
      <mesh position={[0.055, 0, 0.02]}><boxGeometry args={[0.006, 0.14, 0.01]} /><meshStandardMaterial color="#050505" /></mesh>
      <group position={[0, 0, 0.015]} rotation={[0.4, 0, 0]}>
        <mesh><boxGeometry args={[0.09, 0.11, 0.02]} /><meshStandardMaterial color="#222" roughness={0.4} /></mesh>
        <mesh position={[0, 0.035, 0.011]}><planeGeometry args={[0.06, 0.01]} /><meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={3} toneMapped={false} /></mesh>
      </group>
      <mesh position={[0, 0, 0]}><planeGeometry args={[0.16, 0.16]} /><meshBasicMaterial color="#000" /></mesh>
    </group>
  )
}

const IECC14Socket = (props: any) => (
  <group {...props}>
    <mesh position={[0, 0, 0.01]}>
      <extrudeGeometry args={[new THREE.Shape([
        new THREE.Vector2(-0.12, 0.08), new THREE.Vector2(0.12, 0.08),
        new THREE.Vector2(0.12, -0.04), new THREE.Vector2(0.08, -0.09),
        new THREE.Vector2(-0.08, -0.09), new THREE.Vector2(-0.12, -0.04)
      ]), { depth: 0.02, bevelEnabled: false }]} />
      <meshPhysicalMaterial color="#111" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0, 0.005]}>
      <extrudeGeometry args={[new THREE.Shape([
        new THREE.Vector2(-0.1, 0.06), new THREE.Vector2(0.1, 0.06),
        new THREE.Vector2(0.1, -0.03), new THREE.Vector2(0.07, -0.07),
        new THREE.Vector2(-0.07, -0.07), new THREE.Vector2(-0.1, -0.03)
      ]), { depth: 0.04, bevelEnabled: false }]} />
      <meshBasicMaterial color="#000" />
    </mesh>
    <group>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.015, 0.04, 0.03]} /><meshStandardMaterial color="#fff" metalness={1} /></mesh>
      <mesh position={[-0.05, -0.025, 0]}><boxGeometry args={[0.015, 0.04, 0.03]} /><meshStandardMaterial color="#fff" metalness={1} /></mesh>
      <mesh position={[0.05, -0.025, 0]}><boxGeometry args={[0.015, 0.04, 0.03]} /><meshStandardMaterial color="#fff" metalness={1} /></mesh>
    </group>
  </group>
)

function RealisticRearPanel({ position }: { position: [number, number, number] }) {
  const rearZ = 0.010
  const panelWidth = 2.15
  const panelHeight = 0.55
  const sections = { power: -0.85, usb: -0.55, ch1Left: -0.22, master: 0.18, gndBooth: 0.58, ch2: 0.88 }

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, panelHeight / 2, 0]}><boxGeometry args={[panelWidth, panelHeight, 0.02]} /><meshStandardMaterial color="#0a0a0a" roughness={0.8} /></mesh>

      <group position={[-0.88, panelHeight / 2, 0]}>
        <SectionBorder width={0.28} height={0.42} position={[0, 0, 0.01]} />
        <RearLabel text="POWER" size={0.025} position={[0, 0.16, 0.011]} />
        <PowerSwitch position={[0, 0.05, 0]} />
        <RearLabel text="AC IN" size={0.018} position={[0, -0.042, 0.012]} />
        <group rotation={[0, Math.PI, 0]} scale={0.8} position={[0, -0.12, 0.035]}><IECC14Socket position={[0, 0, 0]} /></group>
      </group>

      <group position={[sections.usb, panelHeight / 2, rearZ]}>
        <SectionBorder width={0.22} height={0.4} position={[0, 0, 0]} />
        <RearLabel text="USB" size={0.025} position={[0, 0.16, 0.004]} />
        <USBConnector position={[0, 0.05, 0]} />
        <RearLabel text="DIGITAL OUT" size={0.014} position={[0, -0.08, 0.01]} />
        <RearRCANew type="red" position={[0, -0.14, 0]} />
      </group>

      <group position={[sections.ch1Left, panelHeight / 2, rearZ]}>
        <SectionBorder width={0.34} height={0.4} position={[0, 0, 0]} />
        <RearLabel text="CH 1" size={0.025} position={[0, 0.16, 0.01]} />
        <RearLabel text="PHONO" size={0.012} position={[-0.07, 0.1, 0.01]} />
        <RearLabel text="LINE" size={0.012} position={[0.07, 0.1, 0.01]} />
        <RearRCANew type="white" position={[-0.07, 0.04, 0]} />
        <RearRCANew type="white" position={[0.07, 0.04, 0]} />
        <RearRCANew type="red" position={[-0.07, -0.06, 0]} />
        <RearRCANew type="red" position={[0.07, -0.06, 0]} />
      </group>

      <group position={[sections.master, panelHeight / 2, rearZ]}>
        <SectionBorder width={0.42} height={0.4} position={[0, 0, 0]} />
        <RearLabel text="MASTER 1" size={0.028} position={[0, 0.16, 0.01]} />
        <XLRFemale position={[-0.1, 0, 0]} />
        <XLRFemale position={[0.1, 0, 0]} />
        <RearLabel text="L" size={0.018} position={[-0.1, -0.15, 0.01]} />
        <RearLabel text="R" size={0.018} position={[0.1, -0.15, 0.01]} />
      </group>

      <group position={[sections.gndBooth, panelHeight / 2, rearZ]}>
        <SectionBorder width={0.28} height={0.4} position={[0, 0, 0]} />
        <RearLabel text="GND" size={0.018} position={[0, 0.16, 0.01]} />
        <GroundTerminal position={[0, 0.08, 0]} />
        <RearLabel text="BOOTH OUT" size={0.012} position={[0, -0.04, 0.01]} />
        <TRSConnector position={[-0.07, -0.12, 0]} />
        <TRSConnector position={[0.07, -0.12, 0]} />
      </group>

      <group position={[sections.ch2, panelHeight / 2, rearZ]}>
        <SectionBorder width={0.26} height={0.4} position={[0, 0, 0]} />
        <RearLabel text="CH 2" size={0.025} position={[0, 0.16, 0.01]} />
        <RearRCANew type="white" position={[-0.05, 0.04, 0]} />
        <RearRCANew type="white" position={[0.05, 0.04, 0]} />
        <RearRCANew type="red" position={[-0.05, -0.08, 0]} />
        <RearRCANew type="red" position={[0.05, -0.08, 0]} />
        <RearLabel text="PHONO / LINE" size={0.01} position={[0, -0.16, 0.01]} />
      </group>

      <RearScrew position={[-1.04, panelHeight - 0.04, rearZ]} />
      <RearScrew position={[1.04, panelHeight - 0.04, rearZ]} />
      <RearScrew position={[-1.04, 0.04, rearZ]} />
      <RearScrew position={[1.04, 0.04, rearZ]} />
    </group>
  )
}

// ================================================================================
// UNIQUE COMPONENTS
// ================================================================================

function PhonesInput({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.005, 0]}>
        <torusGeometry args={[0.035, 0.015, 11, 32]} />
        <meshPhysicalMaterial color="#E6C36A" metalness={1} roughness={0.15} reflectivity={1} clearcoat={0.8} />
      </mesh>
    </group>
  )
}

function MixerMetallicLogo({ position }: { position: [number, number, number] }) {
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => {
      const hasZenDots = document.fonts.check("1em Zen Dots")
      if (hasZenDots) setFontLoaded(true)
      else {
        const font = new FontFace("Zen Dots", "url(https://fonts.gstatic.com/s/zendots/v12/XRXX3ICfm00IGoesQeaETM_FcCIG.woff2)")
        font.load().then((loaded) => {
          document.fonts.add(loaded)
          setFontLoaded(true)
        }).catch(() => setFontLoaded(true))
      }
    })
  }, [])

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = '400 50px "Zen Dots", sans-serif'
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText("V0X3D", 10, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [fontLoaded])

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.14]} />
        <meshStandardMaterial map={texture} alphaMap={texture} transparent color="#C0C0C0" roughness={0.1} metalness={0.95} emissive="#FFFFFF" emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}

// ============================================================================
// INSTANCED PERFORMANCE PADS
// ============================================================================
const padGeoOuter = new THREE.BoxGeometry(0.21, 0.008, 0.21)
const padGeoBase = new THREE.BoxGeometry(0.20, 0.015, 0.20)
const padGeoBody = new THREE.BoxGeometry(0.175, 0.022, 0.175)
const padMatOuter = new THREE.MeshStandardMaterial({ color: "#000000", roughness: 1 })
const padMatBase = new THREE.MeshStandardMaterial({ color: "#050505", roughness: 1 })
const padMatBody = new THREE.MeshStandardMaterial({ color: "#111111", roughness: 1, metalness: 0 })

const PAD_VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`
const PAD_FRAG = `
  varying vec2 vUv;
  uniform vec3 uColors[16];
  uniform float uPulses[16];
  uniform int uIndex;
  void main() {
    vec3 base = uColors[uIndex];
    vec3 bright = mix(base, vec3(1.0), 0.2);
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float g = 1.0 - smoothstep(0.0, 1.2, clamp(d, 0.0, 1.0));
    vec3 col = mix(base * 0.88, bright, g);
    float pulse = uPulses[uIndex];
    col = mix(col, vec3(1.0), pulse * 0.7);
    col *= 1.0 + pulse * 2.0;
    gl_FragColor = vec4(col, 1.0);
  }
`

interface InstancedPadsProps {
  padDefs: Array<{ worldPos: [number, number, number]; globalIdx: number }>
  padColorOverrides?: string[]
  defaultColors: string[]
  padPulses: Record<string | number, number>
  interactive: boolean
  onTriggerPad?: (id: number | string) => void
}

function InstancedPerformancePads({ padDefs, padColorOverrides, defaultColors, padPulses, interactive, onTriggerPad }: InstancedPadsProps) {
  const N = padDefs.length

  const outerRef = useRef<THREE.InstancedMesh>(null)
  const baseRef = useRef<THREE.InstancedMesh>(null)
  const bodyRef = useRef<THREE.InstancedMesh>(null)

  const sharedUniforms = useRef<{
    uColors: { value: THREE.Color[] }
    uPulses: { value: number[] }
  }>({
    uColors: {
      value: Array.from({ length: 16 }, (_, i) => {
        const raw = padColorOverrides ? padColorOverrides[i] : defaultColors[i % defaultColors.length]
        return new THREE.Color(raw)
      })
    },
    uPulses: { value: new Array(16).fill(0) },
  })

  const surfaceMaterials = useMemo(() => {
    return padDefs.map((_, i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: PAD_VERT,
        fragmentShader: PAD_FRAG,
        uniforms: {
          ...sharedUniforms.current,
          uIndex: { value: i },
        },
        toneMapped: false,
      })
      return mat
    })
  }, [N, padDefs])

  useEffect(() => {
    padDefs.forEach((def, i) => {
      const raw = padColorOverrides ? padColorOverrides[def.globalIdx] : defaultColors[def.globalIdx % defaultColors.length]
      sharedUniforms.current.uColors.value[i].set(raw)
    })
  }, [padColorOverrides, padDefs, defaultColors])

  useEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    padDefs.forEach((def, i) => {
      const [x, , z] = def.worldPos

      m.compose(new THREE.Vector3(x, 0.004, z), q, new THREE.Vector3(1, 1, 1))
      outerRef.current?.setMatrixAt(i, m)

      m.compose(new THREE.Vector3(x, 0.008, z), q, new THREE.Vector3(1, 1, 1))
      baseRef.current?.setMatrixAt(i, m)

      m.compose(new THREE.Vector3(x, 0.018, z), q, new THREE.Vector3(1, 1, 1))
      bodyRef.current?.setMatrixAt(i, m)
    })
    if (outerRef.current) outerRef.current.instanceMatrix.needsUpdate = true
    if (baseRef.current) baseRef.current.instanceMatrix.needsUpdate = true
    if (bodyRef.current) bodyRef.current.instanceMatrix.needsUpdate = true
  }, [N, padDefs])

  useFrame(() => {
    padDefs.forEach((def, i) => {
      sharedUniforms.current.uPulses.value[i] = padPulses[def.globalIdx] || 0
    })
  })

  return (
    <group>
      <instancedMesh ref={outerRef} args={[padGeoOuter, padMatOuter, N]} frustumCulled={false} />
      <instancedMesh ref={baseRef} args={[padGeoBase, padMatBase, N]} frustumCulled={false} />
      <instancedMesh ref={bodyRef} args={[padGeoBody, padMatBody, N]} frustumCulled={false} />

      {padDefs.map((def, i) => (
        <mesh
          key={i}
          position={[def.worldPos[0], 0.031, def.worldPos[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={surfaceMaterials[i]}
          onClick={interactive ? (e) => { e.stopPropagation(); onTriggerPad?.(def.globalIdx) } : undefined}
          onPointerOver={interactive ? (e) => { e.stopPropagation(); document.body.style.cursor = "pointer" } : undefined}
          onPointerOut={interactive ? () => { document.body.style.cursor = "auto" } : undefined}
        >
          <planeGeometry args={[0.176, 0.176]} />
        </mesh>
      ))}
    </group>
  )
}

function DividerLine({ x, startZ, endZ }: { x: number; startZ: number; endZ: number }) {
  const length = Math.abs(endZ - startZ)
  return (
    <mesh position={[x, 0.028, (startZ + endZ) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.004, length]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </mesh>
  )
}

function USBPortTop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Ajustado Y = -0.003 para colar na superfície */}
      <CanvasLabel position={[0, -0.003, 0.07]} text="USB" size={0.025} color="#888888" />
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.16, 0.01, 0.08]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
      <group position={[0, 0.011, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.14, 0.06]} /><meshBasicMaterial color="#000" /></mesh>
        <mesh position={[0, -0.002, -0.015]}><boxGeometry args={[0.10, 0.008, 0.01]} /><meshStandardMaterial color="#cccccc" roughness={0.9} /></mesh>
      </group>
    </group>
  )
}

function MixerPerformanceButtonB({ position, label, color = "#FF5500" }: { position: [number, number, number]; label: string; color?: string }) {
  const matOuter = useMemo(() => new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 2.0, roughness: 0.3, toneMapped: false }), [color])
  return (
    <group position={position}>
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.23, 0.015, 0.10]} />
        <primitive object={matOuter} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.20, 0.02, 0.07]} />
        <meshStandardMaterial color="#080808" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Este NÃO é rebaixado pois deve repousar no topo físico do próprio botão */}
      <CanvasLabel position={[0, 0.023, 0]} text={label} size={0.02} color="#FFFFFF" />
    </group>
  )
}

function MixerFeet() {
  const positions = [
    [-0.95, -0.615, -1.5],
    [0.95, -0.615, -1.5],
    [-0.95, -0.615, 1.5],
    [0.95, -0.615, 1.5]
  ]

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.068, 0.068, 0.005, 24]} />
            <meshPhysicalMaterial color="#0a0a0a" roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0, -0.003, 0]}>
            <cylinderGeometry args={[0.065, 0.055, 0.025, 24]} />
            <meshPhysicalMaterial color="#0a0a0a" roughness={0.4} metalness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}


// ================================================================================
// MAIN EXPORT: MixerV0X3D
// ================================================================================

interface MixerProps {
  position?: [number, number, number];
  explosionFactor?: number;
  explosionFactorRef?: React.RefObject<number>;
  interactive?: boolean;
  padPulses?: Record<number, number>;
  onTriggerPad?: (index: number) => void;
  vuLevels?: [number, number, number];
  faderValues?: { ch1: number; ch2: number; crossfader: number };
  onFaderChange?: (name: string, value: number) => void;

  chassisColorOverride?: string;
  showGlossyTopOverride?: boolean;
  showFaceplateOverride?: boolean;
  padColorOverrides?: string[];
}

export function MixerV0X3D({
  position = [0, 0, 0],
  explosionFactor = 0,
  explosionFactorRef,
  interactive = false,
  padPulses = {},
  onTriggerPad,
  vuLevels,
  faderValues,
  onFaderChange,
  chassisColorOverride,
  showGlossyTopOverride,
  showFaceplateOverride,
  padColorOverrides,
}: MixerProps) {
  const z = {
    topNav: -1.40, trim: -1.15, hi: -0.90, mid: -0.65, low: -0.40,
    fx: -1.15, filterRow: -0.45, param1: -0.85, param2: -0.62,
    centralVu: -0.35, silverKnob: -0.05, pads1: 0.35, pads2: 0.55, vuMeter: 0.75,
    cue: 1.0, fader: 1.3, crossfader: 1.55, switches: 1.25,
  };
  const colX = { aux: -0.85, ch1: -0.4, ch2: 0.4, master: 0.85 };
  const newChassisHeight = 0.45;

  const storeMixerColor = useScrollStore((s) => s.mixerColor);
  const storeShowGlossy = useScrollStore((s) => s.showGlossyTop);
  const storeShowFaceplate = useScrollStore((s) => s.showFaceplate);
  const pbr = usePBRTextures();

  const finalColor = chassisColorOverride || storeMixerColor;
  const finalGlossy = showGlossyTopOverride ?? storeShowGlossy;
  const finalFaceplate = showFaceplateOverride ?? storeShowFaceplate;

  const allKnobs = useMemo<KnobDef[]>(() => {
    const knobs: KnobDef[] = [];
    const columns = [
      { x: colX.aux, labels: ["TRIM", "LEVEL", "TONE"] },
      { x: colX.ch1, labels: ["TRIM", "HI", "MID", "LOW"] },
      { x: colX.ch2, labels: ["TRIM", "HI", "MID", "LOW"] },
      { x: colX.master, labels: ["TRIM", "MIXING", "LEVEL"] },
    ];
    const zPositions = [z.trim, z.hi, z.mid, z.low];

    columns.forEach((col) => {
      col.labels.forEach((label, j) => {
        knobs.push({ worldX: col.x, worldZ: zPositions[j], scale: 2, label, parentY: 0.010 });
      });
    });
    knobs.push({ worldX: 0, worldZ: z.fx, scale: 2.5, label: "FX", parentY: 0.013 });
    return knobs;
  }, []);

  const allGauges = useMemo<GaugeDef[]>(() => allKnobs.map((k) => ({ worldX: k.worldX, worldZ: k.worldZ, scale: k.scale, parentY: k.parentY, valueRange: ["-\u221e", "+9"] })), [allKnobs]);

  const ventPositions = useMemo(() => {
    const positions: Array<{ x: number; y: number; z: number }> = [];
    const yBase = -newChassisHeight / 1.4;
    [1.104, -1.104].forEach((sideX) => { for (let i = 0; i < 10; i++) { positions.push({ x: sideX, y: yBase, z: 0.1 + (-0.4 + i * 0.07) }) } });
    return positions;
  }, []);

  const faceplateGroupRef = useRef<THREE.Group>(null);
  const knobGroupRef = useRef<THREE.Group>(null);
  const padGroupRef = useRef<THREE.Group>(null);
  const faderGroupRef = useRef<THREE.Group>(null);
  const rearGroupRef = useRef<THREE.Group>(null);
  const localMxEfRef = useRef(0);

  //   useFrame((_, delta) => {
  //     const target = explosionFactorRef ? (explosionFactorRef.current ?? 0) : explosionFactor;
  //    const diff = target - localMxEfRef.current;

  // Otimização: Se a animação de explosão não estiver ocorrendo, interrompe o loop
  //    if (Math.abs(diff) < 0.0001) return;

  //    localMxEfRef.current = THREE.MathUtils.lerp(localMxEfRef.current, target, 1 - Math.pow(0.0001, delta));
  //      const ef = localMxEfRef.current;

  //     if (faceplateGroupRef.current) faceplateGroupRef.current.position.y = ef * 0.1;
  //     if (knobGroupRef.current) knobGroupRef.current.position.y = 0.021 + ef * 0.9;
  //     if (padGroupRef.current) padGroupRef.current.position.y = ef * 0.5;
  //      if (faderGroupRef.current) faderGroupRef.current.position.y = 0.021 + ef * 0.7;
  //     if (rearGroupRef.current) rearGroupRef.current.position.y = ef * 0.85;
  //   });



  useFrame((_, delta) => {
    const target = explosionFactorRef ? (explosionFactorRef.current ?? 0) : explosionFactor;

    // Removemos o "early return" que estava travando a explosão!
    localMxEfRef.current = THREE.MathUtils.damp(localMxEfRef.current, target, 4, delta);
    const ef = localMxEfRef.current;

    if (faceplateGroupRef.current) faceplateGroupRef.current.position.y = ef * 0.1;
    if (knobGroupRef.current) knobGroupRef.current.position.y = 0.021 + ef * 0.9;
    if (padGroupRef.current) padGroupRef.current.position.y = ef * 0.5;
    if (faderGroupRef.current) faderGroupRef.current.position.y = 0.021 + ef * 0.7;
    if (rearGroupRef.current) rearGroupRef.current.position.y = ef * 0.85;
  });



  const defaultPadColors = ["#F06060", "#F0967A", "#3388FF", "#F0C830", "#50D878", "#D050D8", "#50D0E8", "#8060D8"];

  return (
    <group position={position}>
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.6, 3.4]} />
        <MixerChassisMaterial pbr={pbr} cor={finalColor} />
      </mesh>

      <group ref={faceplateGroupRef}>
        {finalFaceplate && (
          <mesh position={[0, 0.006, 0]}>
            <boxGeometry args={[2.16, 0.02, 3.36]} />
            <MixerChassisMaterial pbr={pbr} cor={finalColor} />
          </mesh>
        )}
        {finalGlossy && (
          <mesh position={[0, 0.006, -0.78]}>
            <boxGeometry args={[2.166, 0.021, 1.82]} />
            <MxMatGlossyTop />
          </mesh>
        )}
      </group>

      <group position={[0, 0, 0]}>
        <InstancedVentBars positions={ventPositions} />
      </group>

      <MixerHexScrew position={[1.0, 0.013, -1.6]} />
      <MixerHexScrew position={[-1.0, 0.013, 1.6]} />
      <MixerHexScrew position={[1.0, 0.013, 1.6]} />
      <USBPortTop position={[-0.95, 0.02, -1.6]} />

      <DividerLine x={-0.62} startZ={-1.3} endZ={-0.25} />
      <DividerLine x={0.62} startZ={-1.3} endZ={-0.25} />
      <DividerLine x={-0.2} startZ={-1.3} endZ={-0.25} />
      <DividerLine x={0.2} startZ={-1.3} endZ={-0.25} />

      <group ref={knobGroupRef} position={[0, 0.021, 0]}>
        <group position={[0, -0.009, z.topNav]}>
          <TopNavButton position={[-0.6, 0, 0]} label="BEAT FX" />
          <TopNavButton position={[-0.2, 0, 0]} label="SAMPLER" />
          <TopNavButton position={[0.2, 0, 0]} label="MASTER REC" />
          <TopNavButton position={[0.6, 0, 0]} label="SETUP" />
        </group>
        <group position={[0, 0.021, 0]}>
          <MixerSwitch position={[0, 0, z.param1]} label="PARAM 1" options={["A", "B"]} />
          <MixerSwitch position={[0, 0, z.param2]} label="PARAM 2" options={["A", "B"]} />
          <group position={[0, 0.01, -0.22]} scale={[0.75, 1, 0.65]}>
            <VUMeter position={[0, -0.027, 0]} vuLevels={vuLevels} />
          </group>
          <group position={[0, -0.027, 0.4]}>
            <MixerPerformanceButtonB position={[-0.32, 0, z.filterRow]} label=" " color="#0066FF" />
            <MixerPerformanceButtonB position={[-0.58, 0, z.filterRow]} label=" " color="#00aeff" />
            <MixerPerformanceButtonB position={[-0.84, 0, z.filterRow]} label=" " color="#00e1ff" />
            <MixerPerformanceButtonB position={[0.32, 0, z.filterRow]} label=" " color="#ff004c" />
            <MixerPerformanceButtonB position={[0.58, 0, z.filterRow]} label=" " color="#ff00ea" />
            <MixerPerformanceButtonB position={[0.84, 0, z.filterRow]} label=" " color="#d400ff" />
          </group>
        </group>

        <InstancedKnobBodies knobs={allKnobs} />
        <InstancedKnurling knobs={allKnobs} />
        <InstancedKnobCaps knobs={allKnobs} />
        <InstancedKnobIndicators knobs={allKnobs} />
        <KnobLabels knobs={allKnobs} />
        <InstancedGaugeDots gauges={allGauges} />

        <group ref={padGroupRef}>
          {(() => {
            const padZPositions = [z.pads1, z.pads2];
            const padXOffsets = [-0.33, -0.11, 0.11, 0.33];
            const padDefs: Array<{ worldPos: [number, number, number]; globalIdx: number }> = [];
            [-0.55, 0.55].forEach((sideX, sideIdx) => {
              padZPositions.forEach((pz) => {
                padXOffsets.forEach((px, colIdx) => {
                  const rowIdx = padZPositions.indexOf(pz);
                  const padIdx = rowIdx * 4 + colIdx;
                  const globalIdx = sideIdx * 8 + padIdx;
                  padDefs.push({ worldPos: [sideX + px, 0, pz], globalIdx });
                });
              });
            });
            return (
              <InstancedPerformancePads
                padDefs={padDefs}
                padColorOverrides={padColorOverrides}
                defaultColors={defaultPadColors}
                padPulses={padPulses}
                interactive={interactive}
                onTriggerPad={onTriggerPad}
              />
            );
          })()}
        </group>
      </group>

      <group ref={faderGroupRef} position={[0, 0.021, 0.85]}>
        <group position={[-0.55, 0, 0.2]}>
          <ProFaderMK2 position={[0, 0, 0]} orientation="vertical" length={0.45} value={faderValues?.ch1 ?? 0.7} interactive={interactive} onValueChange={(v: number) => onFaderChange?.("ch1", v)} />
        </group>
        <group position={[0.55, 0, 0.2]}>
          <ProFaderMK2 position={[0, 0, 0]} orientation="vertical" length={0.45} value={faderValues?.ch2 ?? 0.3} interactive={interactive} onValueChange={(v: number) => onFaderChange?.("ch2", v)} />
        </group>

        <group position={[0, -0.005, 0.3]}>
          <MixerSilverKnob position={[0, 0, -0.25]} scale={0.45} />
          <MixerSwitch position={[-0.18, 0, 0]} label="CROSS F. CURVE" options={["ON", "OFF"]} />
          <MixerSwitch position={[0.18, 0, 0]} label="CROSS F. REVERSE" options={["ON", "OFF"]} />
        </group>

        <group position={[0, 0, 0.6]}>
          <ProFaderMK2 position={[0, 0, 0]} orientation="horizontal" length={0.6} value={faderValues?.crossfader ?? 0.5} interactive={interactive} onValueChange={(v: number) => onFaderChange?.("crossfader", v)} />
          <CanvasLabel position={[0, -0.002, -0.18]} text="CROSSFADER" size={0.03} color="#AAAAAA" />
        </group>
        <group position={[-0.90, 0, 0.75]}>
          <group scale={0.6}><PhonesInput position={[0, -0.01, 0]} /></group>
          <CanvasLabel position={[0, -0.002, -0.08]} text="PHONES" size={0.025} color="#666666" />
        </group>
        <MixerMetallicLogo position={[0.95, 0.001, 0.75]} />
      </group>

      <group ref={rearGroupRef}><RealisticRearPanel position={[0, -0.56, -1.694]} />
      </group>
      <group>
        <MixerFeet />
      </group>
    </group>
  );
}
