// turntable-3d.tsx

"use client"

import React, { useRef, useMemo, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { RoundedBox, Cylinder, Tube, Text, Box, Ring, Torus, Sphere, Decal } from "@react-three/drei"
import * as THREE from "three"

import { useTurntableTextures, usePBRTextures, type TurntableTexturesResult, type LoadedTextures, type AllPBRTextures } from "@/lib/textures"
import {
  ConfigurableMaterial,
  MatBlackPlasticHeadshell,
  MatWhitePlasticHeadshell,
  MatChromeHeadshell,
  MatGoldHeadshell,
  MatScrewSlotHeadshell,
  WireRedMatHeadshell,
  WireWhiteMatHeadshell,
  WireGreenMatHeadshell,
  WireBlueMatHeadshell,
  MetalCromoPBRMaterial,
  MetalPaintedPretoPBRMaterial,
  PlasticPowderPBRMaterial,
  PowderMetalChassisMaterial,
  HardwareFinishMaterial,
  MixerChassisMaterial
} from "@/lib/materials"

import { useScrollStore, SCROLL_SECTIONS, type HardwareFinish } from "@/lib/scroll-store"


export const PLATTER_SCALE = 2.85
export const STROBO_SCALE = 1.27
const sharpExtrudeSettings = { steps: 1, depth: 0.08, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2 }

// ===================================================================
// OTIMIZAÇÃO: Cache de Canvas com limite de Memória (Anti Memory-Leak)
// ===================================================================
const MAX_CACHE_SIZE = 80;
const _canvasTextCache = new Map<string, THREE.CanvasTexture>()

function buildCanvasTextTexture(text: string, color: string, fontFamily: string, fontWeight: string, letterSpacing: number) {
  const key = `${text}__${color}__${fontFamily}__${fontWeight}__${letterSpacing}`

  // LRU Logic: Move a textura acessada para o final do map (mais recente)
  if (_canvasTextCache.has(key)) {
    const tex = _canvasTextCache.get(key)!;
    _canvasTextCache.delete(key);
    _canvasTextCache.set(key, tex);
    return tex;
  }

  // Previne memory leak deletando o mais antigo se o cache lotar
  if (_canvasTextCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _canvasTextCache.keys().next().value;
    const oldTex = _canvasTextCache.get(firstKey);
    oldTex?.dispose(); // FUNDAMENTAL para a VRAM do WebGL
    _canvasTextCache.delete(firstKey);
  }

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  const canvasFontSize = 120

  ctx.font = `${fontWeight} ${canvasFontSize}px ${fontFamily}`
  if (letterSpacing && "letterSpacing" in ctx) {
    (ctx as any).letterSpacing = `${letterSpacing * 1000}px`
  }

  const textWidth = ctx.measureText(text).width
  const padding = canvasFontSize * 0.2

  canvas.width = Math.ceil(textWidth + padding * 2)
  canvas.height = Math.ceil(canvasFontSize + padding * 2)

  ctx.font = `${fontWeight} ${canvasFontSize}px ${fontFamily}`
  if (letterSpacing && "letterSpacing" in ctx) {
    (ctx as any).letterSpacing = `${letterSpacing * 1000}px`
  }

  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  tex.minFilter = THREE.LinearFilter
  _canvasTextCache.set(key, tex)
  return tex
}

function CanvasText({
  children,
  fontSize = 0.1,
  color = "#ffffff",
  fontFamily = "monospace, sans-serif",
  fontWeight = "normal",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  anchorX = "center",
  anchorY = "middle",
  letterSpacing = 0,
  castShadow = false,
  receiveShadow = false,
}: any) {
  const text = String(children)
  const key = `${text}__${color}__${fontFamily}__${fontWeight}__${letterSpacing}`

  const [texture, setTexture] = React.useState<THREE.CanvasTexture | null>(
    () => _canvasTextCache.get(key) ?? null
  )

  React.useEffect(() => {
    if (_canvasTextCache.has(key)) {
      setTexture(_canvasTextCache.get(key)!)
      return
    }
    const id = requestAnimationFrame(() => {
      const tex = buildCanvasTextTexture(text, color, fontFamily, fontWeight, letterSpacing)
      setTexture(tex)
    })
    return () => cancelAnimationFrame(id)
  }, [key, text, color, fontFamily, fontWeight, letterSpacing])

  if (!texture) return null

  const scaleFactor = fontSize / 120
  const planeWidth = texture.image.width * scaleFactor
  const planeHeight = texture.image.height * scaleFactor
  const paddingScale = (120 * 0.2) * scaleFactor

  let offsetX = 0
  if (anchorX === "left") offsetX = planeWidth / 2 - paddingScale
  if (anchorX === "right") offsetX = -planeWidth / 2 + paddingScale

  let offsetY = 0
  if (anchorY === "bottom") offsetY = planeHeight / 2 - paddingScale
  if (anchorY === "top") offsetY = -planeHeight / 2 + paddingScale

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[offsetX, offsetY, 0]} receiveShadow={receiveShadow}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial
          map={texture}
          color="#ffffff"
          transparent={true}
          alphaTest={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function Adapter45RPM({ textures }: { textures?: LoadedTextures } = {}) {
  return (
    <group position={[-1.95, 0.045, -1.45]}>
      <Cylinder args={[0.13, 0.13, 0.05, 64]} position={[0, -0.02, 0]} receiveShadow>
        <ConfigurableMaterial textures={textures} configKey="details" />
      </Cylinder>
      <group position={[0, 0.02, 0]}>
        <Cylinder args={[0.17, 0.17, 0.08, 64]} receiveShadow>
          <ConfigurableMaterial textures={textures} configKey="details" />
        </Cylinder>
        <mesh position={[0, 0.041, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.01, 32]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      </group>
    </group>
  )
}


function StrobeLight({ textures, pbr, powerOn = true }: { textures?: LoadedTextures; pbr?: AllPBRTextures; powerOn?: boolean } = {}) {
  const emissiveRef = useRef<THREE.MeshStandardMaterial>(null)
  const spotRef = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)
  const intensityRef = useRef(powerOn ? 1 : 0)

  useFrame((_, delta) => {
    const target = powerOn ? 1 : 0
    const diff = target - intensityRef.current
    const converged = Math.abs(diff) < 0.001
    if (!converged) {
      intensityRef.current += diff * Math.min(1, delta * 4)
      if (emissiveRef.current) emissiveRef.current.emissiveIntensity = intensityRef.current * 8
      if (spotRef.current) spotRef.current.intensity = intensityRef.current * 15
    }
    // Target precisa ser atribuído apenas uma vez após montagem, mas mantemos
    // aqui por segurança (R3F pode resetar o target ao re-render)
    if (spotRef.current && targetRef.current && spotRef.current.target !== targetRef.current) {
      spotRef.current.target = targetRef.current
    }
  })

  return (
    <group position={[0.7, 0.09, 1.7]} rotation={[0, Math.PI, 0]}>
      <Cylinder args={[0.06, 0.06, 0.02, 64]} position={[0, 0.01, 0]}  >
        {pbr ? <MixerChassisMaterial pbr={pbr} cor="#111" /> : <ConfigurableMaterial textures={textures} configKey="details" />}
      </Cylinder>
      <group position={[0, 0.07, 0]}>
        <Cylinder args={[0.045, 0.045, 0.19, 64]} castShadow>
          {pbr ? <MixerChassisMaterial pbr={pbr} cor="#111" /> : <ConfigurableMaterial textures={textures} configKey="details" />}
        </Cylinder>
        <group position={[0, 0.055, 0.046]} rotation={[0, 0, 0]}>
          <Box args={[0.037, 0.035, 0.005]}>
            {pbr ? <MixerChassisMaterial pbr={pbr} cor="#111" /> : <ConfigurableMaterial textures={textures} configKey="details" />}
          </Box>
          <Box args={[0.028, 0.028, 0.005]} position={[0, 0, 0.002]}>
            <meshStandardMaterial ref={emissiveRef} color="#FFFFEE" emissive="#FFFFEE" emissiveIntensity={0} toneMapped={false} transparent opacity={0.9} />
          </Box>

          {/* ALVO INVISÍVEL MANTIDO LOCALMENTE NO PRATO */}
          <object3D ref={targetRef} position={[0.7, -0.09, 1.7]} />

          <spotLight ref={spotRef} color="#FFFFFF" intensity={0} distance={1.7} angle={0.6} penumbra={0.5} decay={1.5} position={[0.02, 0, 0]} shadow-bias={-0.0001} />
        </group>
      </group>
    </group>
  )
}

// Constantes calculadas uma única vez — platterWallAngle não muda nunca
const STROBE_PLATTER_WALL_ANGLE = Math.atan2(
  (0.89 - 0.585) * PLATTER_SCALE,
  0.585 * PLATTER_SCALE
)
const DOT_THICKNESS_FACTOR = 0.25

function StrobeDotsInstancedd({ currentSpeed = 0 }: { currentSpeed: number }) {
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const accumulatedRotation = useRef(0)
  const initializedRef = useRef(false)

  const rows = useMemo(() => [
    { y: 0.027, radius: 0.5916 * PLATTER_SCALE, dotRadius: 0.0075, count: 200, speedMultiplier: 1.68 },
    { y: 0.014, radius: 0.5996 * PLATTER_SCALE, dotRadius: 0.0099, count: 180, speedMultiplier: 1.48 },
    { y: -0.002, radius: 0.6106 * PLATTER_SCALE, dotRadius: 0.015, count: 150, speedMultiplier: 0.005 },
    { y: -0.0199, radius: 0.6213 * PLATTER_SCALE, dotRadius: 0.0099, count: 180, speedMultiplier: 1.41 },
  ], [])

  const totalCount = useMemo(() => rows.reduce((acc, row) => acc + row.count, 0), [rows])

  // Pré-alocados uma única vez — reutilizados a cada frame, sem GC
  const tempObj = useMemo(() => new THREE.Object3D(), [])
  const euler = useMemo(() => new THREE.Euler(), [])

  const baseAngles = useMemo(() => rows.map(row =>
    Array.from({ length: row.count }, (_, i) => (i / row.count) * Math.PI * 2)
  ), [rows])

  useFrame((_, delta) => {
    if (!instancedRef.current) return

    // Se parado e já inicializado, não recalcula nada — zero custo
    if (currentSpeed === 0 && initializedRef.current) return

    accumulatedRotation.current += delta * currentSpeed
    initializedRef.current = true

    let index = 0
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]
      const angles = baseAngles[ri]
      const illusionRotation = accumulatedRotation.current * row.speedMultiplier
      const scaleX = row.dotRadius
      const scaleY = row.dotRadius * DOT_THICKNESS_FACTOR

      for (let i = 0; i < row.count; i++) {
        const angle = angles[i] + illusionRotation
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        tempObj.position.set(cos * row.radius, row.y, sin * row.radius)
        euler.set(STROBE_PLATTER_WALL_ANGLE, -angle + Math.PI / 2, 0, "YXZ")
        tempObj.rotation.copy(euler)
        tempObj.scale.set(scaleX, scaleY, scaleX)
        tempObj.updateMatrix()
        instancedRef.current.setMatrixAt(index++, tempObj.matrix)
      }
    }
    instancedRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, totalCount]}>
      <cylinderGeometry args={[1, 1, 1, 24]} />
      <meshStandardMaterial color="#E0E0E0" roughness={0.15} metalness={0.9} envMapIntensity={0.3} />
    </instancedMesh>
  )
}
function StrobeDotsInstanced({ currentSpeed = 0 }: { currentSpeed: number }) {
  // Array de referências para os 4 "anéis" (InstancedMeshes)
  const rowRefs = useRef<(THREE.InstancedMesh | null)[]>([])

  const rows = useMemo(() => [
    { y: 0.027, radius: 0.5916 * PLATTER_SCALE, dotRadius: 0.0075, count: 200, speedMultiplier: 1.68 },
    { y: 0.014, radius: 0.5996 * PLATTER_SCALE, dotRadius: 0.0099, count: 180, speedMultiplier: 1.48 },
    { y: -0.002, radius: 0.6106 * PLATTER_SCALE, dotRadius: 0.015, count: 150, speedMultiplier: 0.005 },
    { y: -0.0199, radius: 0.6213 * PLATTER_SCALE, dotRadius: 0.0099, count: 180, speedMultiplier: 1.41 },
  ], [])

  // Calcula as posições UMA ÚNICA VEZ na montagem do componente (Performance 1000x melhor)
  React.useEffect(() => {
    const tempObj = new THREE.Object3D()
    const euler = new THREE.Euler()

    rows.forEach((row, ri) => {
      const mesh = rowRefs.current[ri]
      if (!mesh) return

      const scaleX = row.dotRadius
      const scaleY = row.dotRadius * DOT_THICKNESS_FACTOR

      for (let i = 0; i < row.count; i++) {
        const angle = (i / row.count) * Math.PI * 2
        tempObj.position.set(Math.cos(angle) * row.radius, row.y, Math.sin(angle) * row.radius)
        euler.set(STROBE_PLATTER_WALL_ANGLE, -angle + Math.PI / 2, 0, "YXZ")
        tempObj.rotation.copy(euler)
        tempObj.scale.set(scaleX, scaleY, scaleX)
        tempObj.updateMatrix()
        mesh.setMatrixAt(i, tempObj.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    })
  }, [rows])

  // No useFrame, nós apenas giramos os 4 anéis inteiros. Super leve!
  useFrame((_, delta) => {
    if (currentSpeed === 0) return
    rows.forEach((row, ri) => {
      const mesh = rowRefs.current[ri]
      if (mesh) {
        mesh.rotation.y += delta * currentSpeed * row.speedMultiplier
      }
    })
  })

  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E0E0E0", roughness: 0.15, metalness: 0.9, envMapIntensity: 0.3 }), [])
  const geometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 24), [])

  return (
    <group>
      {rows.map((row, i) => (
        <instancedMesh
          key={i}
          ref={(el) => { rowRefs.current[i] = el }}
          args={[geometry, material, row.count]}
        />
      ))}
    </group>
  )
}
// ===================================================================
// CANVAS TEXTURES OTIMIZADAS
// ===================================================================
let _vinylGrooveTextureCache: THREE.CanvasTexture | null = null;

function getVinylGrooveTexture() {
  if (_vinylGrooveTextureCache) return _vinylGrooveTextureCache;

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, 1024, 1024);
    const centerX = 512, centerY = 512;
    for (let i = 160; i < 505; i += 0.3) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, i, 0, 2 * Math.PI);
      ctx.lineWidth = 0.35;
      const shade = Math.random() * 40 + 15;
      ctx.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const trackRadius = 190 + Math.random() * 290;
      ctx.beginPath();
      ctx.arc(centerX, centerY, trackRadius, 0, 2 * Math.PI);
      ctx.lineWidth = 3 + Math.random() * 8;
      ctx.strokeStyle = "rgba(0,0,0, 0.5)";
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  _vinylGrooveTextureCache = texture;
  return texture;
}

let _recordLabelTextureCache: THREE.CanvasTexture | null = null;

function getRecordLabelTexture() {
  if (_recordLabelTextureCache) return _recordLabelTextureCache;

  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, size, size);

  const drawBigText = (text: string, x: number, y: number, color: string, blendMode: GlobalCompositeOperation = 'source-over') => {
    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 240px Arial, sans-serif`;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawBigText("V0", center - 10, center - 82, "#FFFFFF", "difference");
  drawBigText("X", center - 210, center + 90, "#FFFFFF", "difference");
  drawBigText("3D", center + 100, center + 120, "#FFFFFF", "difference");

  ctx.fillStyle = "#FFFFFF";
  ctx.globalCompositeOperation = "difference";
  ctx.font = "bold 24px monospace";
  ctx.fillText("SIDE A", center - 40, 180);
  ctx.fillText("BY KISHORE P", center - 100, size - 150);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(center, center, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  _recordLabelTextureCache = tex;
  return tex;
}

function RecordLabel() {
  const [fontLoaded, setFontLoaded] = React.useState(false)

  React.useEffect(() => {
    document.fonts.ready.then(() => {
      if (document.fonts.check('1em "Zen Dots"')) {
        setFontLoaded(true)
      } else {
        const font = new FontFace("Zen Dots", "url(https://fonts.gstatic.com/s/zendots/v12/XRXX3ICfm00IGoesQeaETM_FcCIG.woff2)")
        font.load().then((loaded) => {
          document.fonts.add(loaded)
          setFontLoaded(true)
        }).catch(() => setFontLoaded(true))
      }
    })
  }, [])

  const texture = useMemo(() => {
    const size = 1024
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!
    const center = size / 2

    ctx.fillStyle = "#111111"
    ctx.fillRect(0, 0, size, size)

    const drawBigText = (text: string, x: number, y: number, color: string, blendMode: GlobalCompositeOperation = 'source-over') => {
      ctx.save()
      ctx.globalCompositeOperation = blendMode
      ctx.fillStyle = color
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = `400 240px "Zen Dots", sans-serif`
      ctx.fillText(text, x, y)
      ctx.restore()
    }

    drawBigText("V0", center - 10, center - 82, "#FFFFFF", "difference")
    drawBigText("X", center - 210, center + 90, "#FFFFFF", "difference")
    drawBigText("3D", center + 100, center + 120, "#FFFFFF", "difference")

    ctx.fillStyle = "#FFFFFF"
    ctx.globalCompositeOperation = "difference"

    ctx.font = "bold 24px monospace"
    ctx.fillText("SIDE A", center - 40, 180)
    ctx.fillText("BY KISHORE P", center - 100, size - 150)

    const drawDenseCircleText = (text: string, radius: number, fontSize: number) => {
      ctx.save()
      ctx.translate(center, center)
      ctx.fillStyle = "#999999"
      ctx.globalCompositeOperation = "difference"
      ctx.font = `bold ${fontSize}px monospace`

      const characters = text.split("")
      const angleStep = (Math.PI * 2) / characters.length

      characters.forEach((char, i) => {
        ctx.save()
        ctx.rotate(i * angleStep)
        ctx.fillText(char, 0, -radius)
        ctx.restore()
      })
      ctx.restore()
    }

    const edgeMargin = 25
    const lineSpacing = 22
    // const content1 = " VOX3D TURNTABLE & MIXER // SPECIAL EDITION // VOX3D TURNTABLE & MIXER // SPECIAL EDITION // ".repeat(2)
    const content2 = " 3D PROJECT V0 // 2026 VIBE CODING - DESIGNED BY KISHORE P // ".repeat(2)

    drawDenseCircleText(content2, center - edgeMargin, 12)
    // drawDenseCircleText(content1, center - edgeMargin - lineSpacing, 11)

    // 6. Furo Central
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = "#000000"
    ctx.beginPath()
    ctx.arc(center, center, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 3
    ctx.stroke()

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 16
    tex.needsUpdate = true
    return tex
  }, [fontLoaded])

  return (
    <group position={[0, 0.0062, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18 * PLATTER_SCALE, 128]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.3}
          metalness={0.2}
          color="#ffffff"
          envMapIntensity={1.0}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </group>
  )
}

function VinylRecord({ currentSpeed = 0, vinylColor = "#050505" }: { currentSpeed?: number; vinylColor?: string }) {
  const ref = useRef<THREE.Group>(null)
  const grooveMap = useMemo(() => getVinylGrooveTexture(), [])

  useFrame((_, delta) => {
    if (ref.current && currentSpeed !== 0) ref.current.rotation.y -= delta * currentSpeed
  })

  return (
    <group ref={ref} position={[0, 0.055, 0]}>
      <Cylinder args={[0.57 * PLATTER_SCALE, 0.57 * PLATTER_SCALE, 0.012, 128]} receiveShadow>
        <meshPhysicalMaterial
          color={vinylColor}
          bumpMap={grooveMap}
          bumpScale={0.008}
          roughnessMap={grooveMap}
          roughness={0.92}
          metalness={0.0}
          clearcoat={0.12}
          clearcoatRoughness={0.7}
          envMapIntensity={0.02}
          reflectivity={0.1}
        />
      </Cylinder>
      <RecordLabel />
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.015, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0, 0.0065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18 * PLATTER_SCALE, 0.195 * PLATTER_SCALE, 64]} />
        <meshPhysicalMaterial color="#050505" roughness={0.5} metalness={0.1} clearcoat={0.3} envMapIntensity={0.05} />
      </mesh>
    </group>
  )
}

function WirelessController({ currentSpeed = 0 }: { currentSpeed?: number }) {
  const ref = useRef<THREE.Group>(null)
  const height = 0.025

  const phaseGeo = useMemo(() => {
    const shape = new THREE.Shape()
    const x = -0.065 / 2
    const y = -0.22 / 2 + 0.06
    shape.moveTo(x, y + 0.005)
    shape.lineTo(x, y + 0.22 - 0.005)
    shape.quadraticCurveTo(x, y + 0.22, x + 0.005, y + 0.22)
    shape.lineTo(x + 0.065 - 0.005, y + 0.22)
    shape.quadraticCurveTo(x + 0.065, y + 0.22, x + 0.065, y + 0.22 - 0.005)
    shape.lineTo(x + 0.065, y + 0.005)
    shape.quadraticCurveTo(x + 0.065, y, x + 0.065 - 0.005, y)
    shape.lineTo(x + 0.005, y)
    shape.quadraticCurveTo(x, y, x, y + 0.005)

    const holePath = new THREE.Path()
    holePath.absarc(0, 0, 0.012, 0, Math.PI * 2, true)
    shape.holes.push(holePath)

    return new THREE.ExtrudeGeometry(shape, { steps: 1, depth: height, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 4, curveSegments: 64 })
  }, [])

  useFrame((_, delta) => {
    if (ref.current && currentSpeed !== 0) ref.current.rotation.z -= delta * currentSpeed
  })

  return (
    <group ref={ref} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      <mesh geometry={phaseGeo} receiveShadow>
        <meshPhysicalMaterial color="#111111" metalness={0.4} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.2} sheen={0.5} sheenColor={new THREE.Color("#333333")} />
      </mesh>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0, height / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.013, 0.013, height + 0.004, 64, 1, true]} />
          <meshStandardMaterial color="#888888" metalness={1.0} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, height + 0.001]}>
          <torusGeometry args={[0.013, 0.0015, 16, 64]} />
          <meshStandardMaterial color="#AAAAAA" metalness={1.0} roughness={0.1} />
        </mesh>
      </group>
      <group position={[0, 0.09, height + 0.002]}>
        <mesh rotation={[Math.PI / 1, 0, 0]}>
          <capsuleGeometry args={[0.002, 0.085, 4, 16]} />
          <meshPhysicalMaterial color="#00ffff" emissive="#00eaff" emissiveIntensity={4} toneMapped={false} roughness={0.2} metalness={0.0} transmission={0.0} thickness={0.01} />
        </mesh>
        <mesh position={[0, 0, -0.002]}>
          <boxGeometry args={[0.005, 0.1, 0.002]} />
          <meshStandardMaterial color="#000000" roughness={1} />
        </mesh>
      </group>
      <group position={[0.035, 0.01, 0.012]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
        <CanvasText fontSize={0.01} color="#cecece" anchorX="center" anchorY="middle">V0X3D</CanvasText>
      </group>
    </group>
  )
}

function Plattere({ currentSpeed = 0, textures: textureProp }: { currentSpeed?: number; textures?: TurntableTexturesResult }) {
  const ref = useRef<THREE.Group>(null)
  const textures = textureProp || useTurntableTextures()

  useFrame((_, delta) => {
    if (ref.current && currentSpeed !== 0) ref.current.rotation.y -= delta * currentSpeed
  })

  return (
    <group ref={ref} position={[-0.35, 0.15, 0]}>
      <Cylinder args={[0.585 * PLATTER_SCALE, 0.63 * PLATTER_SCALE, 0.07, 128]} castShadow receiveShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.3} envMapIntensity={0.15} />
      </Cylinder>
      <Cylinder args={[0.576 * PLATTER_SCALE, 0.585 * PLATTER_SCALE, 0.012, 128]} position={[0, 0.04, 0]} receiveShadow>
        <meshStandardMaterial color="#C0C0C0" roughness={0.25} metalness={0.85} envMapIntensity={0.3} />
      </Cylinder>
      <Cylinder args={[0.625 * PLATTER_SCALE, 0.635 * PLATTER_SCALE, 0.025, 128]} position={[0, -0.04, 0]} receiveShadow>
        <meshStandardMaterial color="#C0C0C0" roughness={0.25} metalness={0.85} envMapIntensity={0.3} />
      </Cylinder>

      <StrobeDotsInstanced currentSpeed={currentSpeed} />

      <group position={[0, 0.06, 0]}>
        <Cylinder args={[0.0415, 0.0415, 0.12, 32]} receiveShadow>
          <meshStandardMaterial color="#E0E0E0" roughness={0.15} metalness={0.9} envMapIntensity={0.3} />
        </Cylinder>
        <Sphere args={[0.042, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.05, 0]}>
          <meshStandardMaterial color="#E0E0E0" roughness={0.15} metalness={0.9} envMapIntensity={0.3} />
        </Sphere>
      </group>
    </group>
  )
}

function Platter({ currentSpeed = 0, textures: textureProp }: { currentSpeed?: number; textures?: TurntableTexturesResult }) {
  const ref = useRef<THREE.Group>(null)
  const textures = textureProp || useTurntableTextures()

  useFrame((_, delta) => {
    if (ref.current && currentSpeed !== 0) ref.current.rotation.y -= delta * currentSpeed
  })

  return (
    <group ref={ref} position={[-0.35, 0.15, 0]}>
      {/* Mantivemos o castShadow para ele fazer sombra no aparelho, mas removemos o receiveShadow para acabar com o pixelado! */}
      <Cylinder args={[0.585 * PLATTER_SCALE, 0.63 * PLATTER_SCALE, 0.07, 128]} castShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.3} envMapIntensity={0.15} />
      </Cylinder>

      <Cylinder args={[0.576 * PLATTER_SCALE, 0.585 * PLATTER_SCALE, 0.012, 128]} position={[0, 0.04, 0]}>
        <meshStandardMaterial color="#C0C0C0" roughness={0.25} metalness={0.85} envMapIntensity={0.3} />
      </Cylinder>

      <Cylinder args={[0.625 * PLATTER_SCALE, 0.635 * PLATTER_SCALE, 0.025, 128]} position={[0, -0.04, 0]}>
        <meshStandardMaterial color="#C0C0C0" roughness={0.25} metalness={0.85} envMapIntensity={0.3} />
      </Cylinder>

      <StrobeDotsInstanced currentSpeed={currentSpeed} />

      <group position={[0, 0.06, 0]}>
        {/* Aqui também removido o receiveShadow do pino central */}
        <Cylinder args={[0.0415, 0.0415, 0.12, 32]}>
          <meshStandardMaterial color="#E0E0E0" roughness={0.15} metalness={0.9} envMapIntensity={0.3} />
        </Cylinder>
        <Sphere args={[0.042, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0.05, 0]}>
          <meshStandardMaterial color="#E0E0E0" roughness={0.15} metalness={0.9} envMapIntensity={0.3} />
        </Sphere>
      </group>
    </group>
  )
}
function PopupStylusLight({ textures, pbr, powerOn = true, onTogglePower }: { textures?: LoadedTextures; pbr?: AllPBRTextures; powerOn?: boolean; onTogglePower?: () => void } = {}) {
  const mainRadius = 0.1;
  const emissiveRef = useRef<THREE.MeshStandardMaterial>(null)
  const spotRef = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)
  const intensityRef = useRef(powerOn ? 1 : 0)

  useFrame((_, delta) => {
    const target = powerOn ? 1 : 0
    const diff = target - intensityRef.current
    if (Math.abs(diff) >= 0.001) {
      intensityRef.current += diff * Math.min(1, delta * 4)
      if (emissiveRef.current) emissiveRef.current.emissiveIntensity = intensityRef.current * 15
      if (spotRef.current) spotRef.current.intensity = intensityRef.current * 15
    }
    if (spotRef.current && targetRef.current && spotRef.current.target !== targetRef.current) {
      spotRef.current.target = targetRef.current
    }
  })

  return (
    <group position={[-2.0, 0.122, 1.3]} rotation={[0, 0.9, 0]} scale={STROBO_SCALE} onClick={(e) => {
      if (onTogglePower) {
        e.stopPropagation();
        onTogglePower()
      }
    }} onPointerOver={(e) => {
      if (onTogglePower) {
        e.stopPropagation();
        document.body.style.cursor = 'pointer'
      }
    }} onPointerOut={() => { if (onTogglePower) document.body.style.cursor = 'auto' }}>
      <Cylinder args={[mainRadius, mainRadius, 0.14, 64]} position={[0, 0.05, 0]} castShadow receiveShadow>
        {pbr ? <MixerChassisMaterial pbr={pbr} cor="#111" /> : <ConfigurableMaterial textures={textures} configKey="details" />}
      </Cylinder>
      <group position={[0, 0.05, 0]} rotation={[0, Math.PI - 1.8, 0]} receiveShadow>
        <Cylinder args={[0.101, 0.101, 0.07, 32, 1, false, -Math.PI / 7, Math.PI / 3.5]}>
          <meshStandardMaterial ref={emissiveRef} color="#FF0000" emissive="#FF0000" emissiveIntensity={0} toneMapped={false} transparent opacity={0.9} />
        </Cylinder>

        <object3D ref={targetRef} position={[0, 0, 1]} />

        <spotLight ref={spotRef} color="#FF0000" intensity={0} distance={1.7} angle={0.6} penumbra={0.4} decay={1.5} position={[0, 0, 0.002]} />
      </group>

      <Cylinder args={[0.1, 0.1, 0.025, 64]} position={[0, 0.135, 0]}  >
        {pbr ? <MixerChassisMaterial pbr={pbr} cor="#111" /> : <ConfigurableMaterial textures={textures} configKey="details" />}
      </Cylinder>
      <Torus args={[0.085, 0.003, 16, 32]} position={[0, 0.145, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {pbr ? <MetalCromoPBRMaterial textures={pbr.metalCromo} roughness={0.2} /> : <ConfigurableMaterial textures={textures} configKey="details" />}
      </Torus>

    </group>
  )
}






function SpeedMarkings() {
  const marks = [
    { y: 0.12, label: "+6.4", dotSize: 0.01 },
    { y: 0.06, label: "3.3", dotSize: 0.012 },
    { y: 0, label: "0", dotSize: 0.018, active: true },
    { y: -0.06, label: "-3.3", dotSize: 0.012 },
  ]
  return (
    <group position={[-2.1, 0.101, 1]} rotation={[-Math.PI / 2, 0, - Math.PI / 2]} scale={0.6}>
      {marks.map((mark, i) => (
        <group key={i} position={[0, mark.y, 0]}>
          <Ring args={[0, mark.dotSize, 32]} position={[-0.05, 0, 0.001]} receiveShadow>
            <meshStandardMaterial color={mark.active ? "#FFFFFF" : "#888888"} emissive={mark.active ? "#FFFFFF" : "#000000"} emissiveIntensity={mark.active ? 0.5 : 0} />
          </Ring>
          <Text position={[0.01, 0, 0]} fontSize={0.035} color={mark.active ? "#EEEEEE" : "#888888"} anchorX="left" receiveShadow>{mark.label}</Text>
        </group>
      ))}
      <group position={[0.16, 0.032, 0]}>
        <Box args={[0.005, 0.19, 0.001]} position={[0, 0, 0]} receiveShadow><meshStandardMaterial color="#666666" /></Box>
        <Box args={[0.05, 0.005, 0.001]} position={[-0.025, 0.095, 0]} receiveShadow><meshStandardMaterial color="#666666" /></Box>
        <Box args={[0.05, 0.005, 0.001]} position={[-0.025, -0.095, 0]} receiveShadow><meshStandardMaterial color="#666666" /></Box>
        <Text position={[-0.015, -0.04, 0]} fontSize={0.04} color="#666666" anchorX="right" receiveShadow>%</Text>
      </group>
    </group>
  )
}

function SpeedMarkings2() {
  const marks = [
    { y: 0.12, label: "+6.4", dotSize: 0.01 },
    { y: 0.06, label: "3.3", dotSize: 0.012 },
    { y: 0, label: "0", dotSize: 0.018, active: true },
    { y: -0.06, label: "-3.3", dotSize: 0.012 },
  ]
  return (
    <group position={[-1.8, 0.101, 1.42]} rotation={[-Math.PI / 2, 0, 0]} scale={0.6}>
      {marks.map((mark, i) => (
        <group key={i} position={[0, mark.y, 0]}>
          <Ring args={[0, mark.dotSize, 32]} position={[-0.05, 0, 0.001]} receiveShadow>
            <meshStandardMaterial color={mark.active ? "#FFFFFF" : "#888888"} emissive={mark.active ? "#FFFFFF" : "#000000"} emissiveIntensity={mark.active ? 0.5 : 0} />
          </Ring>
          <Text position={[0.01, 0, 0]} fontSize={0.035} color={mark.active ? "#EEEEEE" : "#888888"} anchorX="left" receiveShadow>{mark.label}</Text>
        </group>
      ))}
      <group position={[0.16, 0.032, 0]}>
        <Box args={[0.005, 0.19, 0.001]} position={[0, 0, 0]} receiveShadow><meshStandardMaterial color="#666666" /></Box>
        <Box args={[0.05, 0.005, 0.001]} position={[-0.025, 0.095, 0]} receiveShadow><meshStandardMaterial color="#666666" /></Box>
        <Box args={[0.05, 0.005, 0.001]} position={[-0.025, -0.095, 0]} receiveShadow><meshStandardMaterial color="#666666" /></Box>
        <Text position={[-0.015, -0.04, 0]} fontSize={0.04} color="#666666" anchorX="right" receiveShadow>%</Text>
      </group>
    </group>
  )
}






function StartStopButton2({ pbr, onToggleStart }: { pbr?: AllPBRTextures; onToggleStart?: () => void } = {}) {
  return (
    <group position={[-2.07, 0.1, 1.65]} onClick={(e) => { if (onToggleStart) { e.stopPropagation(); onToggleStart() } }} onPointerOver={(e) => { if (onToggleStart) { e.stopPropagation(); document.body.style.cursor = 'pointer' } }} onPointerOut={() => { if (onToggleStart) document.body.style.cursor = 'auto' }}>
      <RoundedBox args={[0.36, 0.02, 0.3]} radius={0.01} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
      </RoundedBox>
      <RoundedBox args={[0.32, 0.04, 0.26]} radius={0.015} position={[0, 0.012, 0]} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
      </RoundedBox>
      <Text position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.028} color="#CCCCCC" anchorX="center">START STOP</Text>
    </group>
  )
}
function StartStopButton({ pbr, onToggleStart }: { pbr?: AllPBRTextures; onToggleStart?: () => void } = {}) {
  return (
    <group position={[-2.03, 0.1, 1.62]} onClick={(e) => { if (onToggleStart) { e.stopPropagation(); onToggleStart() } }} onPointerOver={(e) => { if (onToggleStart) { e.stopPropagation(); document.body.style.cursor = 'pointer' } }} onPointerOut={() => { if (onToggleStart) document.body.style.cursor = 'auto' }}>
      <RoundedBox args={[0.36, 0.02, 0.3]} radius={0.01} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
      </RoundedBox>
      <RoundedBox args={[0.32, 0.04, 0.26]} radius={0.015} position={[0, 0.012, 0]} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
      </RoundedBox>
      <Text position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} fontSize={0.028} color="#CCCCCC" anchorX="center">START STOP</Text>
    </group>
  )
}





function SpeedButtons({ pbr }: { pbr?: AllPBRTextures } = {}) {
  return (
    <group position={[-1.75, 0.1, 1.62]} rotation={[0, -Math.PI / 2, 0]}>
      <group position={[-0.08, 0, 0]}>
        <RoundedBox args={[0.14, 0.023, 0.1]} radius={0.008}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <RoundedBox args={[0.12, 0.012, 0.085]} radius={0.005} position={[0, 0.012, 0]}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <Text position={[0, 0.021, -0.008]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#999999" anchorX="center">33</Text>
        <Box args={[0.06, 0.003, 0.012]} position={[0.00, 0.021, 0.025]}>
          <meshStandardMaterial color="#00ff80" emissive="#00ff80" emissiveIntensity={2} toneMapped={false} />
        </Box>
      </group>

      <group position={[0.08, 0, 0]}>
        <RoundedBox args={[0.14, 0.023, 0.1]} radius={0.008}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <RoundedBox args={[0.12, 0.012, 0.085]} radius={0.005} position={[0, 0.012, 0]}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <Text position={[0, 0.021, -0.008]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#999999" anchorX="center">45</Text>
        <Box args={[0.06, 0.003, 0.012]} position={[0.00, 0.021, 0.025]}>
          <meshStandardMaterial color="#333333" roughness={0.7} />
        </Box>
      </group>
    </group>
  )
}
function SpeedButtons2({ pbr }: { pbr?: AllPBRTextures } = {}) {
  return (
    <group position={[-1.53, 0.1, 1.75]}>
      <group position={[-0.19, 0, 0]}>
        <RoundedBox args={[0.24, 0.023, 0.1]} radius={0.008}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <RoundedBox args={[0.22, 0.012, 0.085]} radius={0.005} position={[0, 0.012, 0]}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <Text position={[-0.05, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#999999" anchorX="center">33</Text>
        <Box args={[0.04, 0.003, 0.012]} position={[0.04, 0.021, 0]}>
          <meshStandardMaterial color="#00ff80" emissive="#00ff80" emissiveIntensity={2} toneMapped={false} />
        </Box>
      </group>
      <group position={[0.06, 0, 0]}>
        <RoundedBox args={[0.24, 0.023, 0.1]} radius={0.008}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <RoundedBox args={[0.22, 0.012, 0.085]} radius={0.005} position={[0, 0.012, 0]}>
          {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.5} />}
        </RoundedBox>
        <Text position={[-0.05, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#999999" anchorX="center">45</Text>
        <Box args={[0.04, 0.003, 0.012]} position={[0.04, 0.021, 0]}>
          <meshStandardMaterial color="#333333" roughness={0.7} />
        </Box>
      </group>
    </group>
  )
}





function PitchFaderKnob({ textures }: { textures?: LoadedTextures } = {}) {
  const depth = 0.085
  const knobShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.055, 0)
    s.bezierCurveTo(-0.035, 0.01, -0.026, 0.02, -0.026, 0.05)
    s.lineTo(0.026, 0.05)
    s.bezierCurveTo(0.026, 0.02, 0.035, 0.01, 0.055, 0)
    s.closePath()
    return s
  }, [])

  return (
    <group>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[0.004, 0.04, 0.004]} />
        <ConfigurableMaterial textures={textures} configKey="knobs" />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-depth / 2, 0, 0]} receiveShadow>
        <extrudeGeometry args={[knobShape, { steps: 1, depth: depth, bevelEnabled: false, curveSegments: 32 }]} />
        <ConfigurableMaterial textures={textures} configKey="knobs" />
      </mesh>
      <mesh position={[0, 0.0515, 0]} receiveShadow  >
        <boxGeometry args={[depth, 0.003, 0.052]} />
        <ConfigurableMaterial textures={textures} configKey="knobs" />
      </mesh>
      <mesh position={[0, 0.0535, 0]} receiveShadow>
        <boxGeometry args={[depth + 0.001, 0.001, 0.006]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </group>
  )
}

function PitchFader({ textures }: { textures?: LoadedTextures } = {}) {
  return (
    <group position={[2, 0.1, 1.15]}>
      <RoundedBox args={[0.2, 0.02, 1.1]} radius={0.003} position={[0.05, -0.027, 0]} receiveShadow >
        <ConfigurableMaterial textures={textures} configKey="details" />
      </RoundedBox>
      <Box args={[0.012, 0.01, 0.92]} position={[0.05, -0.015, 0]} receiveShadow >
        <meshBasicMaterial color="#000000" />
      </Box>
      <group position={[-0.28, 0.002, 0]}>
        {[
          { z: -0.42, label: "-8" },
          { z: -0.315, label: "-6" },
          { z: -0.21, label: "-4" },
          { z: -0.105, label: "-2" },
          { z: 0, label: " " },
          { z: 0.105, label: "+2" },
          { z: 0.21, label: "+4" },
          { z: 0.315, label: "+6" },
          { z: 0.42, label: "+8" },
        ].map((mark, i) => (
          <group key={i} position={[0.2, 0, mark.z]}>
            <Box args={[0.04, 0.003, 0.003]} position={[0, 0, 0]} receiveShadow><meshStandardMaterial color="#888" /></Box>
            {i < 8 && <Box args={[0.025, 0.002, 0.002]} position={[0.005, 0, 0.0525]} receiveShadow><meshStandardMaterial color="#555" /></Box>}
            <Text position={[-0.045, 0, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} fontSize={0.028} color="#d6d6d6" anchorX="right">{mark.label}</Text>
          </group>
        ))}
      </group>
      <RoundedBox args={[0.025, 0.025, 0.025]} radius={0.01} position={[-0.13, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2.0} toneMapped={false} />
      </RoundedBox>
      <group position={[0.05, -0.011, 0.1]} scale={[1.5, 1.5, 1.5]}>
        <PitchFaderKnob textures={textures} />
      </group>
      <Text position={[0.05, 0.001, 0.55]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.022} color="#666" anchorX="center">PITCH</Text>
    </group>
  )
}






function TonearmBaseRecess({ textures, chassisColor, pbr }: { textures?: LoadedTextures; chassisColor?: string; pbr?: AllPBRTextures } = {}) {
  const dishProfile = useMemo(() => {
    const points = []
    points.push(new THREE.Vector2(0.58, -0.15))
    points.push(new THREE.Vector2(0.58, 0))
    for (let i = 0; i <= 50; i++) {
      const t = i / 50
      points.push(new THREE.Vector2(0.58 - t * 0.18, (-0.06) * t - Math.sin(t * Math.PI) * 0.08))
    }
    points.push(new THREE.Vector2(0.4, -0.06))
    points.push(new THREE.Vector2(0, -0.06))
    return points
  }, [])

  // Usa a mesma cor do chassis para acompanhar a cor selecionada
  const finalColor = chassisColor || "#1a1a1a"

  return (
    <group position={[1.64, 0.1, -1]}>
      <mesh receiveShadow>
        <latheGeometry args={[dishProfile, 128]} />
        {pbr?.powderMetal ? <PowderMetalChassisMaterial textures={pbr.powderMetal} color={finalColor} /> : <meshStandardMaterial color={finalColor} roughness={0.35} metalness={0.5} />}
      </mesh>
    </group>
  )
}

function ChassisLogos() {
  return (
    <group position={[2.135, 0.103, -1.78]} rotation={[0, -Math.PI / 2, 0]}>
      <Text position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.03} color="#575757" anchorX="left">Special Edition</Text>
      <Text position={[0, 0, 0.04]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.03} color="#575757" anchorX="left">Turntable System</Text>
    </group>
  )
}

function MetallicLogo() {
  const [fontLoaded, setFontLoaded] = React.useState(false)

  React.useEffect(() => {
    document.fonts.ready.then(() => {
      if (document.fonts.check("1em Zen Dots")) setFontLoaded(true)
      else new FontFace("Zen Dots", "url(https://fonts.gstatic.com/s/zendots/v12/XRXX3ICfm00IGoesQeaETM_FcCIG.woff2)").load().then((f) => { document.fonts.add(f); setFontLoaded(true) }).catch(() => setFontLoaded(true))
    })
  }, [])

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = `400 75px "Zen Dots", sans-serif`
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText("V0X3D", 10, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [fontLoaded])

  return (
    <group position={[2.20, 0.101, -1.54]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.14]} />
        <meshStandardMaterial map={texture} alphaMap={texture} transparent color="#C0C0C0" roughness={0.1} metalness={0.95} emissive="#FFFFFF" emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}

function TurntableFoot({ position, pbr }: { position: [number, number, number]; pbr?: AllPBRTextures }) {
  return (
    <group position={position}>
      <Cylinder args={[0.28, 0.28, 0.18, 32]} position={[0, 0.09, 0]} castShadow receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111111" /> : <meshStandardMaterial color="#111" />}
      </Cylinder>
      <Cylinder args={[0.2, 0.22, 0.02, 24]} position={[0, 0.19, 0]} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#1a1a1a" /> : <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.35} />}
      </Cylinder>
      <Cylinder args={[0.16, 0.16, 0.025, 24]} position={[0, 0.2025, 0]} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#1a1a1a" /> : <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.35} />}
      </Cylinder>
      <Cylinder args={[0.18, 0.18, 0.025, 24]} position={[0, 0.2275, 0]}>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#1a1a1a" /> : <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.35} />}
      </Cylinder>
      <Cylinder args={[0.27, 0.27, 0.08, 32]} position={[0, 0.28, 0]}>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111111" /> : <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.4} />}
      </Cylinder>
      <Cylinder args={[0.22, 0.22, 0.18, 24]} position={[0, 0.39, 0]}>
        <meshStandardMaterial color="#050505" roughness={0.9} metalness={0.1} />
      </Cylinder>
    </group>
  )
}

function PlatterWell({ textures, chassisColor, pbr }: { textures?: TurntableTexturesResult; chassisColor?: string; pbr?: AllPBRTextures } = {}) {
  // Usa a mesma cor do chassis para acompanhar a cor selecionada
  const finalColor = chassisColor || "#1a1a1a"

  return (
    <group position={[-0.35, 0.098, 0]}>
      <Cylinder args={[0.64 * PLATTER_SCALE, 0.64 * PLATTER_SCALE, 0.15, 48]} position={[0, -0.075, 0]} receiveShadow>
        {pbr?.powderMetal ? <PowderMetalChassisMaterial textures={pbr.powderMetal} color={finalColor} /> : <meshStandardMaterial color={finalColor} roughness={0.35} metalness={0.5} />}
      </Cylinder>
    </group>
  )
}

function Slipmat() {
  return (
    <group position={[-0.35, 0.195, 0]}>
      <Cylinder args={[0.57 * PLATTER_SCALE, 0.57 * PLATTER_SCALE, 0.008, 64]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} metalness={0.0} />
      </Cylinder>
    </group>
  )
}

function CueingLever() {
  const leverPath = useMemo(() => new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.08, 0.19)), [])
  const paddleGeometry = useMemo(() => {
    const height = 0.155
    const geo = new THREE.CylinderGeometry(0.01, 0.01, height, 32, 24)
    geo.translate(0, height / 2, 0)
    const pos = geo.attributes.position
    const vector = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      vector.fromBufferAttribute(pos, i)
      const t = Math.max(0, Math.min(1, vector.y / height))
      const smoothT = t * t * (3 - 2 * t)
      pos.setX(i, vector.x * (1.0 + smoothT * 0.9))
      pos.setZ(i, vector.z * (1.0 - smoothT * 0.45) - (t * t * 0.08))
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <group>
      <group position={[0, 0.04, 0]}>
        {[-0.025, 0.025].map(x => (
          <group key={x} position={[x, 0, 0]} scale={1.1}>
            <mesh position={[0, -0.01, 0]} >
              <boxGeometry args={[0.012, 0.02, 0.04]} />
              <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} >
              <cylinderGeometry args={[0.02, 0.02, 0.012, 32]} />
              <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh receiveShadow><cylinderGeometry args={[0.016, 0.016, 0.03, 32]} /><meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} /></mesh>
          <mesh><cylinderGeometry args={[0.004, 0.004, 0.07, 32]} /><meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} /></mesh>
        </group>
        <group rotation={[-0.25, 0, 0]}>
          <group position={[0, 0.009, 0]}>
            <Tube args={[leverPath, 4, 0.005, 16, false]}  ><meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} /></Tube>
            <group position={[0, 0.08, 0.19]} rotation={[Math.PI / 3.0, Math.PI, 0]}>
              <mesh geometry={paddleGeometry}  ><meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} /></mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function TonearmRest() {
  const hookShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0.057, 0.055)
    s.lineTo(0.057, 0)
    s.absarc(0, 0, 0.057, 0, Math.PI, true)
    s.lineTo(-0.057, 0.005)
    s.lineTo(-0.047, 0.005)
    s.lineTo(-0.047, 0)
    s.absarc(0, 0, 0.047, Math.PI, 0, false)
    s.lineTo(0.047, 0.055)
    s.lineTo(0.057, 0.055)
    return s
  }, [])

  return (
    <group>
      <mesh position={[0, 0.0755, 0]} receiveShadow><cylinderGeometry args={[0.015, 0.015, 0.151, 32]} /><meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} /></mesh>
      <group position={[0, 0.085, 0]}>
        <mesh receiveShadow><cylinderGeometry args={[0.018, 0.018, 0.045, 32]} /><meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} /></mesh>
        <group position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh receiveShadow><cylinderGeometry args={[0.008, 0.008, 0.015, 16]} /><meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} /></mesh>
          <mesh position={[0, 0.006, 0]}><boxGeometry args={[0.002, 0.005, 0.012]} /><meshBasicMaterial color="#111" /></mesh>
        </group>
      </group>
      <mesh position={[0, 0.204, -0.015]} receiveShadow>
        <extrudeGeometry args={[hookShape, { steps: 1, depth: 0.03, bevelEnabled: false }]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      <group position={[0.007, 0.01, -0.14]} rotation={[0, 1.52, 0]}>
        <mesh receiveShadow><boxGeometry args={[0.28, 0.015, 0.035]} /><meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[-0.14, 0, 0]}><cylinderGeometry args={[0.0175, 0.0175, 0.015, 32]} /><meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} /></mesh>
      </group>
      <mesh position={[0, 0.022, 0]}><cylinderGeometry args={[0.025, 0.03, 0.04, 32]} /><meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} /></mesh>
    </group>
  )
}

function TonearmConnector() {
  const ridgesRef = useRef<THREE.InstancedMesh>(null)
  const ridgeGeo = useMemo(() => new THREE.BoxGeometry(0.05, 0.005, 0.005), [])
  const ridgeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#333" }), [])

  useMemo(() => {
    if (!ridgesRef.current) return
    const tempObj = new THREE.Object3D()
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2
      tempObj.position.set(0, Math.sin(angle) * 0.053, Math.cos(angle) * 0.053)
      tempObj.rotation.set(angle, 0, 0)
      tempObj.updateMatrix()
      ridgesRef.current.setMatrixAt(i, tempObj.matrix)
    }
    ridgesRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} receiveShadow  >
        <cylinderGeometry args={[0.043, 0.043, 0.12, 24]} />
        <meshStandardMaterial color="#333333" metalness={1} roughness={0.1} />
      </mesh>
      <group position={[-0.04, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}  >
          <cylinderGeometry args={[0.052, 0.052, 0.06, 24]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.4} />
        </mesh>
        <instancedMesh ref={ridgesRef} args={[ridgeGeo, ridgeMat, 24]} />
      </group>
    </group>
  )
}

function Counterweight({ pbr, hardwareFinish = "black" }: { pbr?: AllPBRTextures; hardwareFinish?: HardwareFinish }) {
  return (
    <group position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
      <group position={[0, -0.05, 0]}>
        <Cylinder args={[0.04, 0.04, 0.3, 32]} castShadow>
          {pbr ? <HardwareFinishMaterial finish={hardwareFinish} pbr={pbr} part="tube" /> : <meshStandardMaterial color="#888" />}
        </Cylinder>
        {[0, 0.04, 0.08].map((y, i) => (
          <Cylinder key={i} args={[0.042, 0.042, 0.005, 32]} position={[0, -0.1 + y, 0]}>
            {pbr ? <HardwareFinishMaterial finish={hardwareFinish} pbr={pbr} part="tube" /> : <meshStandardMaterial color="#888" />}
          </Cylinder>
        ))}
      </group>

      <Cylinder args={[0.13, 0.135, 0.2, 64]} castShadow>
        {pbr ? <HardwareFinishMaterial finish={hardwareFinish} pbr={pbr} part="body" /> : <meshStandardMaterial color="#555" />}
      </Cylinder>
      <Cylinder args={[0.134, 0.1, 0.02, 64]} position={[0, -0.095, 0]}>
        {pbr ? <HardwareFinishMaterial finish={hardwareFinish} pbr={pbr} part="body" /> : <meshStandardMaterial color="#555" />}
      </Cylinder>
      <Cylinder args={[0.136, 0.136, 0.015, 64]} position={[0, 0.1, 0]}>
        {pbr ? <HardwareFinishMaterial finish={hardwareFinish} pbr={pbr} part="body" /> : <meshStandardMaterial color="#555" />}
      </Cylinder>

      <group position={[0, 0.142, 0]}>
        <Cylinder args={[0.128, 0.128, 0.07, 64]}>
          <meshStandardMaterial color="#111" roughness={0.4} />
        </Cylinder>
        {Array.from({ length: 40 }).map((_, i) => {
          const isMajor = i % 10 === 0
          return (
            <group key={i} rotation={[0, -(i / 40) * Math.PI * 2, 0]}>
              <Box args={[0.0015, isMajor ? 0.03 : 0.015, 0.005]} position={[0.129, 0.01, 0]}><meshBasicMaterial color={isMajor ? "#fff" : "#555"} /></Box>
              {isMajor && <Text position={[0.129, -0.018, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.024} color="#fff" fontWeight="bold" anchorX="center">{i / 10}</Text>}
            </group>
          )
        })}
      </group>

      <group position={[0, -0.16, 0]}>
        <Cylinder args={[0.045, 0.045, 0.04, 32]}><meshStandardMaterial color="#111" roughness={0.4} /></Cylinder>
        <Sphere args={[0.045, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, -0.02, 0]} rotation={[Math.PI, 0, 0]}><meshStandardMaterial color="#111" roughness={0.4} /></Sphere>
      </group>
    </group>
  )
}

function TonearmPivotSleeve() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.071, 0.071, 0.7, 24]} position={[0, -0.08, 0]}><meshPhysicalMaterial color="#050505" roughness={0.1} metalness={0.3} clearcoat={1.0} /></Cylinder>
      <Cylinder args={[0.0568, 0.071, 0.06, 24]} position={[0, 0.3, 0]}><meshPhysicalMaterial color="#050505" roughness={0.1} metalness={0.3} clearcoat={1.0} /></Cylinder>
      <Torus args={[0.0568, 0.004, 12, 24]} position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#c0c0c0" roughness={0.25} metalness={0.9} /></Torus>
    </group>
  )
}

function GimbalMechanism({ pbr }: any) {
  const yokeShape = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 0.13
    const h = 0.24
    shape.moveTo(-w, -h)
    shape.lineTo(-w, h)
    shape.lineTo(w, h)
    shape.lineTo(w, -h)
    shape.closePath()
    const hole = new THREE.Path()
    const innerW = 0.09
    const innerH = 0.19
    hole.moveTo(-innerW, -innerH)
    hole.lineTo(innerW, -innerH)
    hole.lineTo(innerW, innerH)
    hole.lineTo(-innerW, innerH)
    hole.closePath()
    shape.holes.push(hole)
    return shape
  }, [])

  return (
    <group>
      <mesh castShadow receiveShadow position={[-0.03, 0, -0.04]}>
        <extrudeGeometry args={[yokeShape, sharpExtrudeSettings]} />
        {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#222222" roughness={0.65} metalness={0.8} />}
      </mesh>

      <group position={[-0.028, 0, 0]}>
        <group position={[0, 0.24, 0]}>
          <Cylinder args={[0.035, 0.035, 0.015, 24]}>
            {pbr ? <MetalCromoPBRMaterial textures={pbr.metalCromo} roughness={0.2} /> : <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />}
          </Cylinder>
          <Box args={[0.04, 0.006, 0.01]} position={[0, 0.008, 0]}>
            <meshStandardMaterial color="#111" />
          </Box>
        </group>
        <group position={[0, -0.24, 0]}>
          <Cylinder args={[0.035, 0.035, 0.015, 24]}>
            {pbr ? <MetalCromoPBRMaterial textures={pbr.metalCromo} roughness={0.2} /> : <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />}
          </Cylinder>
          <Box args={[0.04, 0.006, 0.01]} position={[0, -0.008, 0]}>
            <meshStandardMaterial color="#111" />
          </Box>
        </group>
      </group>

      <group position={[-0.03, 0, 0.01]}>
        <Cylinder args={[0.028, 0.028, 0.44, 24]}>
          {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />}
        </Cylinder>
        <group rotation={[0, 0, Math.PI / 2]}>
          <Cylinder args={[0.03, 0.03, 0.16, 24]}>
            {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />}
          </Cylinder>
          <Cylinder args={[0.025, 0.025, 0.22, 24]}>
            {pbr ? <MetalCromoPBRMaterial textures={pbr.metalCromo} roughness={0.2} /> : <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />}
          </Cylinder>
        </group>
      </group>
    </group>
  )
}

function HighDensityKnurling({ radius, height }: { radius: number, height: number }) {
  const segments = 100
  const rows = 14
  const count = segments * rows
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.012, 0.012, 0.006), [])
  const boxMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#888", metalness: 1, roughness: 0.2 }), [])

  React.useEffect(() => {
    if (!instancedRef.current) return
    let i = 0
    for (let r = 0; r < rows; r++) {
      for (let s = 0; s < segments; s++) {
        const angle = (s / segments) * Math.PI * 2
        const shift = (r % 2) * (Math.PI / segments)
        dummy.position.set(Math.cos(angle + shift) * (radius + 0.003), (r / rows) * height - height / 2 + height / rows / 2, Math.sin(angle + shift) * (radius + 0.003))
        dummy.rotation.set(0, -(angle + shift), Math.PI / 4)
        dummy.updateMatrix()
        instancedRef.current.setMatrixAt(i++, dummy.matrix)
      }
    }
    instancedRef.current.instanceMatrix.needsUpdate = true
  }, [radius, height, dummy])

  return (
    <group>
      <Cylinder args={[radius, radius, height, 80]}><meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.4} /></Cylinder>
      <instancedMesh ref={instancedRef} args={[boxGeo, boxMat, count]} />
    </group>
  )
}

function AntiSkatingKnobb({ pbr }: { pbr?: AllPBRTextures }) {
  const knobRadius = 0.09
  const knobHeight = 0.07

  return (
    <group>
      <Cylinder args={[knobRadius - 0.002, knobRadius - 0.002, knobHeight, 64]}  >
        {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#1a1a1a" roughness={0.8} />}
      </Cylinder>
      <group>
        <Cylinder args={[knobRadius, knobRadius, 0.005, 64]} position={[0, knobHeight / 2 - 0.0025, 0]}>
          {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#1a1a1a" roughness={0.8} />}
        </Cylinder>
        <Cylinder args={[knobRadius, knobRadius, 0.005, 64]} position={[0, -knobHeight / 2 + 0.0025, 0]}>
          {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#1a1a1a" roughness={0.8} />}
        </Cylinder>
      </group>

      {Array.from({ length: 64 }).map((_, i) => {
        const angle = (i / 64) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * (knobRadius - 0.001), 0, Math.sin(angle) * (knobRadius - 0.001)]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.004, knobHeight - 0.01, 0.004]} />
            {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#1a1a1a" roughness={0.8} />}
          </mesh>
        )
      })}

      <group position={[0, knobHeight / 2, 0]}>
        <Cylinder args={[knobRadius * 0.98, knobRadius * 0.98, 0.005, 64]}>
          {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#1a1a1a" roughness={0.8} />}
        </Cylinder>
        <group position={[0, 0.001, 0]}>
          <Cylinder args={[0.031, 0.031, 0.01, 32]}>
            {pbr ? <MetalCromoPBRMaterial textures={pbr.metalCromo} roughness={0.2} /> : <meshStandardMaterial color="#333" roughness={0.4} metalness={0.8} />}
          </Cylinder>
        </group>
        <group position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {Array.from({ length: 31 }).map((_, i) => (
            <group key={i} rotation={[0, 0, Math.PI - (i / 30) * Math.PI]}>
              <Box args={[i % 10 === 0 ? 0.012 : 0.006, 0.0015, 0.001]} position={[0.074, 0, 0]}><meshBasicMaterial color="#b9b9b9" /></Box>
              {i % 10 === 0 && <group position={[0.052, 0, 0]}><CanvasText rotation={[0, 0, -Math.PI / 2]} fontSize={0.018} color="#b9b9b9" anchorX="center" anchorY="middle">{i / 10}</CanvasText></group>}
            </group>
          ))}
          {"ANTI-SKATING".split("").map((char, i, arr) => (
            <group key={i} rotation={[0, 0, Math.PI * 1.25 + (i / (arr.length - 1)) * (Math.PI * 0.5)]}>
              <CanvasText position={[0.082, 0, 0]} rotation={[0, 0, Math.PI / 2]} fontSize={0.011} color="#b9b9b9" anchorX="center" anchorY="bottom">{char}</CanvasText>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}

function AntiSkatingKnob({ pbr }: { pbr?: AllPBRTextures }) {
  return (
    <group>
      <Box args={[0.22, 0.02, 0.14]} position={[-0.14, 0.001, 0]} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.8} />}
      </Box>
      <Cylinder args={[0.095, 0.095, 0.02, 32]} position={[0, 0.009, 0]} receiveShadow>
        {pbr ? <PlasticPowderPBRMaterial textures={pbr.plasticPowder} color="#111" /> : <meshStandardMaterial color="#1a1a1a" roughness={0.8} />}
      </Cylinder>
      <group position={[0, 0.04, 0]}><AntiSkatingKnobb pbr={pbr} /></group>
    </group>
  )
}

function UnifiedGimbalHousing({ position = [0, 0, 0], textures, pbr }: { position?: [number, number, number]; textures?: TurntableTexturesResult; pbr?: AllPBRTextures }) {
  const towerShape = useMemo(() => {
    const shape = new THREE.Shape()

    const horizontalOuterX = 0.2
    const verticalOuterX = -0.155
    const topOuterY = 0.433
    const bottomOuterY = 0.04
    const thickness = 0.05

    const verticalInnerX = verticalOuterX + thickness
    const topInnerY = topOuterY - thickness
    const bottomInnerY = bottomOuterY + thickness

    shape.moveTo(verticalOuterX, topOuterY)
    shape.lineTo(horizontalOuterX, topOuterY)
    shape.lineTo(horizontalOuterX, topInnerY)
    shape.lineTo(verticalInnerX, topInnerY)
    shape.lineTo(verticalInnerX, bottomInnerY)
    shape.lineTo(horizontalOuterX, bottomInnerY)
    shape.lineTo(horizontalOuterX, bottomOuterY)
    shape.lineTo(verticalOuterX, bottomOuterY)

    shape.closePath()

    return shape
  }, [])

  const extrudeSettings = useMemo(
    () => ({ steps: 1, depth: 0.08, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 }),
    [],
  )

  return (
    <group position={position}>
      <group>
        {/* Base Principal do Gimbal */}
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.06, 64]} />
          {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#222222" roughness={0.65} metalness={0.8} />}
        </mesh>

        <group position={[0, 0.05, 0]}>
          <Cylinder args={[0.12, 0.12, 0.1, 24]}>
            {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#111" roughness={0.4} />}
          </Cylinder>
          <Cylinder args={[0.125, 0.125, 0.008, 24]} position={[0, 0.05, 0]}>
            {pbr ? <MetalCromoPBRMaterial textures={pbr.metalCromo} roughness={0.2} /> : <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />}
          </Cylinder>
        </group>

        <group position={[0, 0.12, 0]}>
          <Cylinder args={[0.05, 0.05, 0.06, 24]}>
            {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#111" roughness={0.4} />}
          </Cylinder>
        </group>

        <group position={[0.15, 0.007, 0.12]} rotation={[0, 0.5, 0]}>
          <CueingLever textures={textures} />
        </group>

        <group position={[0, 0.01, 0.39]} rotation={[0, 0, 0]}>
          <TonearmRest textures={textures} />
        </group>
      </group>

      <group position={[-0.15, 0, -0.05]} rotation={[0, -0.4, 0]}>
        {/* Torre Lateral do Gimbal */}
        <mesh castShadow receiveShadow position={[0, 0, -0.04]}>
          <extrudeGeometry args={[towerShape, extrudeSettings]} />
          {pbr ? <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} /> : <meshStandardMaterial color="#222222" roughness={0.65} metalness={0.8} />}
        </mesh>

        <group position={[0.115, 0.421, 0]}>
          {/* Parafuso Superior da Torre Lateral */}
          <Cylinder args={[0.03, 0.03, 0.015, 24]}>
            {pbr ? <MetalCromoPBRMaterial textures={pbr.metalCromo} roughness={0.2} /> : <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />}
          </Cylinder>
          <Box args={[0.04, 0.004, 0.008]} position={[0, 0.008, 0]}>
            <meshStandardMaterial color="#111" />
          </Box>
        </group>
      </group>
    </group>
  )
}

function VtaAndGimbalAssembly({ textures, pbr }: { textures?: TurntableTexturesResult; pbr?: AllPBRTextures; hardwareFinish?: HardwareFinish }) {
  const vtaRadius = 0.38
  const vtaHeight = 0.185

  return (
    <group>
      <group position={[0, 0.1, 0]}>
        <HighDensityKnurling radius={vtaRadius} height={vtaHeight} />

        {/* Tampa do VTA   */}
        <Cylinder
          args={[vtaRadius + 0.01, vtaRadius + 0.01, 0.008, 64]}
          position={[0, vtaHeight / 2, 0]}
          receiveShadow
        >
          {pbr ? (
            <MetalPaintedPretoPBRMaterial textures={pbr.metalPaintedPreto} />
          ) : (
            <meshStandardMaterial color="#222" roughness={0.4} metalness={0.8} />
          )}
        </Cylinder>

        <Cylinder
          args={[vtaRadius + 0.01, vtaRadius + 0.01, 0.004, 64]}
          position={[0, -vtaHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#0d0d0d" metalness={0.6} roughness={0.3} />
        </Cylinder>
      </group>

      <group position={[0, 0.2, 0]}>
        <Cylinder args={[0.32, 0.38, 0.03, 64]} castShadow receiveShadow>
          <meshStandardMaterial color="#0d0d0d" metalness={0.6} roughness={0.3} />
        </Cylinder>

        {["0", "1", "2", "3", "4", "5", "6"].map((num, i) => {
          const angle = (i / 14) * Math.PI * 2
          const slopeAngle = Math.atan(0.5)

          return (
            <group key={i} rotation={[0, -angle, 0]}>
              <Text
                position={[0, 0.006, 0.34]}
                rotation={[-Math.PI / 2 + slopeAngle, Math.PI / 99, 0]}
                fontSize={0.02}
                fontWeight="bold"
                color="#7c7c7c"
                anchorX="center"
                anchorY="middle"
              >
                {num}
              </Text>
            </group>
          )
        })}
      </group>

      <UnifiedGimbalHousing position={[0, 0.21, 0]} textures={textures} pbr={pbr} />

      <group position={[0.38, 0.215, 0.004]}>
        <AntiSkatingKnob pbr={pbr} />
      </group>
    </group>
  )
}






const useOrtofonTexture = () =>
  useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, 512, 128)
      ctx.fillStyle = "#cc0000"
      ctx.font = "bold 80px Helvetica, Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("ortofon", 256, 64)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

const useVNLTexture = () =>
  useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 100px Helvetica, Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("VNL", 128, 128)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

const useSymbolTexture = () =>
  useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256)
      ctx.fillStyle = "#cc0000"

      // Desenha a primeira barra inclinada
      ctx.beginPath()
      ctx.moveTo(80, 60)
      ctx.lineTo(120, 60)
      ctx.lineTo(100, 196)
      ctx.lineTo(60, 196)
      ctx.fill()

      // Desenha a segunda barra inclinada
      ctx.beginPath()
      ctx.moveTo(140, 60)
      ctx.lineTo(180, 60)
      ctx.lineTo(160, 196)
      ctx.lineTo(120, 196)
      ctx.fill()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

function VNLCartridge() {
  const ortofonTexture = useOrtofonTexture()
  const vnlTexture = useVNLTexture()
  const symbolTexture = useSymbolTexture()

  const bodyWidth = 0.32
  const bodyHeight = 0.14
  const bodyDepth = 0.48

  const sidePartX = bodyWidth / 2 + 0.02
  const frontZ = bodyDepth / 2 + 0.001

  return (
    <group>
      <Box args={[0.06, 0.14, 0.15]} position={[-sidePartX, 0.07, 0.02]} castShadow><MatBlackPlasticHeadshell /></Box>
      <Box args={[0.06, 0.14, 0.15]} position={[sidePartX, 0.07, 0.02]} castShadow><MatBlackPlasticHeadshell /></Box>
      <Box args={[bodyWidth, 0.14, bodyDepth]} position={[0, 0.07, 0]} castShadow><MatBlackPlasticHeadshell /></Box>

      {/* BLOCO BRANCO CENTRAL */}
      <Box args={[bodyWidth, bodyHeight, bodyDepth]} position={[0, -0.07, 0]} castShadow>
        <MatWhitePlasticHeadshell />
        {/* Logo (FRENTE) */}
        <mesh position={[0, -0.01, frontZ]}>
          <planeGeometry args={[0.44, 0.1]} />
          <meshBasicMaterial map={ortofonTexture} transparent depthWrite={false} />
        </mesh>
      </Box>

      {/* BLOCO PRETO INFERIOR */}
      <group position={[0, -0.21, 0]}>
        <Box args={[bodyWidth - 0.02, bodyHeight, bodyDepth]}  >
          <MatBlackPlasticHeadshell />
          {/* Logo VNL (FRENTE) */}
          <mesh position={[0, 0, frontZ]}>
            <planeGeometry args={[0.15, 0.15]} />
            <meshBasicMaterial map={vnlTexture} transparent depthWrite={false} />
          </mesh>
        </Box>

        {/* Acabamento Lateral Direito + SÍMBOLO INCLINADO */}
        <Box args={[0.02, bodyHeight, bodyDepth]} position-x={bodyWidth / 2 - 0.01}>
          <MatBlackPlasticHeadshell />
          <mesh position={[0.011, 0, 0.1]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.12, 0.12]} />
            <meshBasicMaterial map={symbolTexture} transparent depthWrite={false} />
          </mesh>
        </Box>

        {/* Acabamento Lateral Esquerdo + SÍMBOLO INCLINADO */}
        <Box args={[0.02, bodyHeight, bodyDepth]} position-x={-(bodyWidth / 2 - 0.01)}>
          <MatBlackPlasticHeadshell />
          <mesh position={[-0.011, 0, 0.1]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.12, 0.12]} />
            <meshBasicMaterial map={symbolTexture} transparent depthWrite={false} />
          </mesh>
        </Box>
      </group>

      {/* Agulha */}
      <group position={[0, -0.275, 0.18]}>
        <Box args={[0.18, 0.05, 0.14]}><MatBlackPlasticHeadshell /></Box>
        <Cylinder args={[0.003, 0.003, 0.07, 8]} rotation={[-0.5, 0, 0]} position={[0, -0.05, 0.075]}><MatChromeHeadshell /></Cylinder>
      </group>
    </group>
  )
}

function WavyWireHeadshell({ startPos, endPos, color }: { startPos: [number, number, number]; endPos: [number, number, number]; color: "red" | "white" | "green" | "blue" }) {

  const curve = useMemo(() => {
    const p0 = new THREE.Vector3(...startPos)
    const p5 = new THREE.Vector3(...endPos)

    const midX = (p0.x + p5.x) / 2
    const midY = (p0.y + p5.y) / 2
    const midZ = (p0.z + p5.z) / 2

    // p1 garante que o fio sai RETO do pino dourado
    const p1 = new THREE.Vector3(p0.x, p0.y, p0.z - 0.03)
    // p4 garante que o fio entra RETO no conector traseiro
    const p4 = new THREE.Vector3(p5.x, p5.y, p5.z + 0.03)

    let p2, p3

    // Perfis únicos de curvatura e embaraçamento para cada fio
    switch (color) {
      case "red":
        p2 = new THREE.Vector3(midX + 0.08, midY - 0.08, midZ + 0.1)
        p3 = new THREE.Vector3(midX + 0.03, midY - 0.02, midZ - 0.08)
        break
      case "white":
        p2 = new THREE.Vector3(midX - 0.07, midY - 0.03, midZ + 0.12)
        p3 = new THREE.Vector3(midX - 0.01, midY - 0.1, midZ - 0.05)
        break
      case "green":
        p2 = new THREE.Vector3(midX + 0.013, midY - 0.18, midZ + 0.01)
        p3 = new THREE.Vector3(midX + 0.01, midY - 0.01, midZ - 0.08)
        break
      case "blue":
        p2 = new THREE.Vector3(midX - 0.02, midY - 0.15, midZ + 0.08)
        p3 = new THREE.Vector3(midX - 0.01, midY - 0.04, midZ - 0.1)
        break
    }

    return new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, p5], false, "catmullrom", 0.6)
  }, [startPos, endPos, color])

  return (
    <group>
      <Tube args={[curve, 48, 0.009, 8, false]} >
        {color === "red" && <WireRedMatHeadshell />}
        {color === "white" && <WireWhiteMatHeadshell />}
        {color === "green" && <WireGreenMatHeadshell />}
        {color === "blue" && <WireBlueMatHeadshell />}
      </Tube>

      {/* Pino Dourado Dianteiro */}
      <Cylinder args={[0.015, 0.015, 0.03, 16]} rotation-x={Math.PI / 2} position={[startPos[0], startPos[1], startPos[2] - 0.015]}>
        <MatGoldHeadshell />
      </Cylinder>

      {/* Pino Dourado Traseiro */}
      <Cylinder args={[0.015, 0.015, 0.03, 16]} rotation-x={Math.PI / 2} position={[endPos[0], endPos[1], endPos[2] + 0.015]}>
        <MatGoldHeadshell />
      </Cylinder>
    </group>
  )
}

function WiresAssemblyHeadshell({ expansionY = 0, expansionX = 0, expansionZ = 0 }: { expansionY?: number, expansionX?: number, expansionZ?: number }) {
  const topPinY = 0.05 + expansionY
  const bottomPinY = -0.09 + expansionY
  const pinBaseZ = -0.2

  const cartridgePins: [number, number, number][] = [
    [0.08 + expansionX, topPinY, pinBaseZ + expansionZ],
    [-0.08 + expansionX, topPinY, pinBaseZ + expansionZ],
    [0.08 + expansionX, bottomPinY, pinBaseZ + expansionZ],
    [-0.08 + expansionX, bottomPinY, pinBaseZ + expansionZ],
  ]
  const headshellPins: [number, number, number][] = [
    [0.025, 0.025, -0.72],
    [-0.025, 0.025, -0.72],
    [0.025, -0.025, -0.72],
    [-0.025, -0.025, -0.72],
  ]

  return (
    <group>
      <WavyWireHeadshell startPos={cartridgePins[0]} endPos={headshellPins[0]} color="red" />
      <WavyWireHeadshell startPos={cartridgePins[1]} endPos={headshellPins[1]} color="white" />
      <WavyWireHeadshell startPos={cartridgePins[2]} endPos={headshellPins[2]} color="green" />
      <WavyWireHeadshell startPos={cartridgePins[3]} endPos={headshellPins[3]} color="blue" />
    </group>
  )
}

function ExposedScrewHeadshell({ position }: { position: [number, number, number] }) {
  const headshellThickness = 0.035
  const headYPos = headshellThickness / 2 + 0.0125
  const headHeight = 0.025

  return (
    <group position={position}>
      <Cylinder args={[0.05, 0.05, 0.025, 6]} position-y={headYPos}>
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
      </Cylinder>
      <Box args={[0.08, headHeight + 0.001, 0.01]} position-y={headYPos}>
        <MatScrewSlotHeadshell />
      </Box>
      <Cylinder args={[0.06, 0.06, 0.01, 16]} position-y={headshellThickness / 2}>
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
      </Cylinder>
      <Cylinder args={[0.022, 0.022, 0.22, 16]} position-y={-0.1}>
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
      </Cylinder>
      <Cylinder args={[0.045, 0.045, 0.03, 6]} position-y={-0.21}>
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
      </Cylinder>
    </group>
  )
}

function AnimatedWiresHeadshell({ explosionFactorRef }: { explosionFactorRef?: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    const ef = explosionFactorRef ? (explosionFactorRef.current ?? 0) : 0
    const t = Math.min(ef * 0.5, 1)
    // Acompanha o cartridge: cartOffsetX=1*t, cartOffsetY=-0.35*t, cartOffsetZ=1*t
    // Os fios são gerados pelo WiresAssemblyHeadshell com expansionX/Y/Z=0 (posição base).
    // Como os fios ficam no mesmo group que o headshell (scale 0.3), eles já estão em espaço local.
    // Apenas escondemos durante a explosão para não "esticar" incorretamente.
    groupRef.current.visible = t < 0.05
  })

  return (
    <group ref={groupRef}>
      <WiresAssemblyHeadshell />
    </group>
  )
}

function HeadshellBodyVNL() {
  const shellShape = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 0.28
    const l = 1.2
    const narrowW = w - 0.06

    shape.moveTo(-narrowW, 0)
    shape.lineTo(narrowW, 0)
    shape.lineTo(w, 0.15)
    shape.lineTo(w, l)
    shape.lineTo(-w, l)
    shape.lineTo(-w, 0.15)
    shape.closePath()

    const slotYStart = 0.4
    const slotYEnd = 0.15
    const hole1 = new THREE.Path()
    hole1.moveTo(-0.22, slotYStart)
    hole1.lineTo(-0.22, slotYEnd)
    hole1.lineTo(-0.16, slotYEnd)
    hole1.lineTo(-0.16, slotYStart)
    hole1.closePath()
    shape.holes.push(hole1)
    const hole2 = new THREE.Path()
    hole2.moveTo(0.16, slotYStart)
    hole2.lineTo(0.16, slotYEnd)
    hole2.lineTo(0.22, slotYEnd)
    hole2.lineTo(0.22, slotYStart)
    hole2.closePath()
    shape.holes.push(hole2)

    const centerCutout0 = new THREE.Path()
    centerCutout0.moveTo(-0.15, 0.58)
    centerCutout0.lineTo(0.13, 0.58)
    centerCutout0.lineTo(0.15, 0.65)
    centerCutout0.lineTo(-0.13, 0.65)
    centerCutout0.closePath()
    shape.holes.push(centerCutout0)

    const centerCutout = new THREE.Path()
    centerCutout.moveTo(-0.15, 0.7)
    centerCutout.lineTo(0.13, 0.7)
    centerCutout.lineTo(0.15, 0.8)
    centerCutout.lineTo(-0.13, 0.8)
    centerCutout.closePath()
    shape.holes.push(centerCutout)

    const centerCutout1 = new THREE.Path()
    centerCutout1.moveTo(-0.15, 0.85)
    centerCutout1.lineTo(0.13, 0.85)
    centerCutout1.lineTo(0.15, 0.92)
    centerCutout1.lineTo(-0.13, 0.92)
    centerCutout1.closePath()
    shape.holes.push(centerCutout1)

    return shape
  }, [])

  const fingerLiftShape = useMemo(() => {
    const s = new THREE.Shape()
    const sc = 0.33

    s.moveTo(0, 0)
    s.bezierCurveTo(1 * sc, 0, 1.0 * sc, -0.5 * sc, 1.8 * sc, -0.8 * sc)
    s.lineTo(2.5 * sc, -0.9 * sc)
    s.lineTo(2.5 * sc, -0.7 * sc)
    s.bezierCurveTo(1.0 * sc, -0.3 * sc, 0.8 * sc, 0.2 * sc, 0, 0.15 * sc)

    return s
  }, [])

  const shellExtrudeSettings = {
    depth: 0.055,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 3,
  }

  const liftExtrudeSettings = {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  }

  return (
    <group>
      <mesh castShadow receiveShadow rotation-x={-Math.PI / 2}>
        <extrudeGeometry args={[shellShape, shellExtrudeSettings]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
      </mesh>

      <group position={[0.8, 0.12, -0.46]} rotation={[Math.PI / 2, -0.4, 3.1]}>
        <mesh rotation={[-Math.PI / 2, 0, -0.2]} castShadow receiveShadow>
          <extrudeGeometry args={[fingerLiftShape, liftExtrudeSettings]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

function RearConnectorHeadshell() {
  return (
    <group position={[0, 0.004, -0.8]}>
      <Cylinder args={[0.055, 0.055, 0.15, 32]} rotation-x={Math.PI / 2} position-z={-0.12}>
        <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.95} />
      </Cylinder>
      {[
        [-0.025, 0.025],
        [0.025, 0.025],
        [-0.025, -0.025],
        [0.025, -0.025],
      ].map((pos, i) => (
        <Cylinder key={i} args={[0.012, 0.012, 0.08, 8]} rotation-x={Math.PI / 2} position={[pos[0], pos[1], -0.21]}>
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} envMapIntensity={0.6} />
        </Cylinder>
      ))}
      <Box args={[0.22, 0.2, 0.1]}  >
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.3} />
      </Box>
      <Cylinder args={[0.01, 0.08, 0.04, 32]} rotation-x={Math.PI / 2} position-z={0.07}>
        <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.95} />
      </Cylinder>
    </group>
  )
}

function easeOutCubicHeadshell(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}


// ================================================================================
// BACK PANEL
// ================================================================================

const REAR_MATS = {
  blackPlastic: { color: "#080808", roughness: 0.4, metalness: 0.0 },
  gold: { color: "#ffd700", roughness: 0.15, metalness: 1.0 },
  silver: { color: "#eeeeee", roughness: 0.25, metalness: 0.95 },
  redPlastic: { color: "#cc0000", roughness: 0.3, metalness: 0.0 },
  whitePlastic: { color: "#dddddd", roughness: 0.4, metalness: 0.0 },
}

const ProScrew = ({ pos }: { pos: [number, number, number] }) => (
  <group position={[pos[0], pos[1], 0.011]} rotation={[Math.PI / 2, 0, 0]}>
    <mesh>
      <cylinderGeometry args={[0.008, 0.008, 0.003, 16]} />
      <meshStandardMaterial color="#222" roughness={0.4} metalness={0.1} />
    </mesh>
    <group position={[0, 0.002, 0]}>
      <mesh><boxGeometry args={[0.01, 0.002, 0.002]} /><meshStandardMaterial color="#000" roughness={1} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[0.01, 0.002, 0.002]} /><meshStandardMaterial color="#000" roughness={1} /></mesh>
    </group>
  </group>
)

const TurntableACSocket = (props: any) => (
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

const TurntableUSBTopDesign = (props: any) => (
  <group {...props}>
    <RoundedBox args={[0.16, 0.08, 0.01]} radius={0.005} position={[0, 0, 0.005]}>
      <meshStandardMaterial color="#050505" />
    </RoundedBox>
    <mesh position={[0, 0, 0.011]}>
      <planeGeometry args={[0.14, 0.06]} />
      <meshBasicMaterial color="#000" />
    </mesh>
    <mesh position={[0, -0.015, 0.01]}>
      <boxGeometry args={[0.10, 0.01, 0.008]} />
      <meshStandardMaterial color="#cccccc" roughness={0.9} />
    </mesh>
  </group>
)

const TurntableGround = (props: any) => (
  <group {...props}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.005]}>
      <cylinderGeometry args={[0.05, 0.05, 0.01, 32]} />
      <meshPhysicalMaterial {...REAR_MATS.blackPlastic} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.025]}>
      <cylinderGeometry args={[0.04, 0.04, 0.035, 32]} />
      <meshPhysicalMaterial color="#888" roughness={0.3} metalness={0.9} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.045]}>
      <cylinderGeometry args={[0.015, 0.015, 0.04, 16]} />
      <meshPhysicalMaterial {...REAR_MATS.silver} />
    </mesh>
  </group>
)

const TurntableRCA = ({ type = "red", ...props }: any) => (
  <group {...props}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.045, 0.045, 0.012, 24]} /><meshPhysicalMaterial {...REAR_MATS.blackPlastic} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}><cylinderGeometry args={[0.04, 0.04, 0.04, 24]} /><meshPhysicalMaterial {...REAR_MATS.gold} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.022]}><cylinderGeometry args={[0.030, 0.030, 0.042, 24]} /><meshPhysicalMaterial {...(type === "red" ? REAR_MATS.redPlastic : REAR_MATS.whitePlastic)} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.023]}><cylinderGeometry args={[0.012, 0.012, 0.044, 12]} /><meshPhysicalMaterial {...REAR_MATS.blackPlastic} /></mesh>
  </group>
)

function BackPanel2() {
  const verticalCenterOffset = -0.02

  return (
    <group position={[0, -0.21, -1.73]} rotation={[0, Math.PI, 0]}>
      <group>
        <mesh receiveShadow>
          <boxGeometry args={[1.5, 0.21, 0.02]} />
          <meshStandardMaterial color="#0b0b0b" roughness={0.7} metalness={0.2} />
        </mesh>

        <ProScrew pos={[-0.7, 0.085, 0]} />
        <ProScrew pos={[0.7, 0.085, 0]} />
        <ProScrew pos={[-0.7, -0.085, 0]} />
        <ProScrew pos={[0.7, -0.085, 0]} />
      </group>

      {/* 1. ÁREA DE ENERGIA */}
      <group position={[-0.55, verticalCenterOffset - 0.015, 0.03]} scale={0.8}>
        <TurntableACSocket scale={0.85} rotation={[0, Math.PI, 0]} />
        <Text position={[0, 0.085, -0.022]} fontSize={0.025} color="#888" fontWeight={700}>AC IN</Text>
      </group>

      {/* 2. USB DO TAMPO */}
      <group position={[-0.25, verticalCenterOffset - 0.025, 0.01]}>
        <TurntableUSBTopDesign />
        <Text position={[0, 0.07, 0.0025]} fontSize={0.025} color="#888" fontWeight={700}>USB</Text>
      </group>

      {/* 3. TERMINAL TERRA (GND) */}
      <group position={[-0.05, verticalCenterOffset, 0.01]}>
        <TurntableGround />
        <Text position={[0.08, 0, 0.0025]} fontSize={0.02} color="#888" anchorX="left" fontWeight={700}>GND</Text>
      </group>

      {/* 4. BLOCO RCA PHONO */}
      <group position={[0.45, verticalCenterOffset, 0]}>
        <mesh position={[0, 0, 0.0105]}>
          <planeGeometry args={[0.56, 0.145]} />
          <meshBasicMaterial color="#333" />
        </mesh>

        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.55, 0.14]} />
          <meshStandardMaterial color="#141414" roughness={0.5} />
        </mesh>

        <group position={[0, 0, 0.017]}>
          <group position={[-0.12, 0, 0]}>
            <TurntableRCA type="red" position={[0, -0.01, 0]} />
            <Text position={[0, 0.05, -0.005]} fontSize={0.018} color="#888" fontWeight={700}>R</Text>
          </group>

          <group position={[0.12, 0, 0]}>
            <TurntableRCA type="white" position={[0, -0.01, 0]} />
            <Text position={[0, 0.05, -0.005]} fontSize={0.018} color="#888" fontWeight={700}>L</Text>
          </group>

          <Text position={[0, -0.048, -0.005]} fontSize={0.02} color="#888" letterSpacing={0.05} fontWeight={700}>
            PHONO OUT
          </Text>
        </group>
      </group>
    </group>
  )
}


function ChassisBottom() {
  return (
    <group position={[0, -0.32, 0]}>
      <Box args={[4.2, 0.002, 3.3]} receiveShadow>
        {/* Preto absoluto que absorve a luz */}
        <meshStandardMaterial color="#020202" roughness={0.5} metalness={0.1} />
      </Box>
    </group>
  )
}


function ChassisWithHole({ chassisColor, explosionY = 0, pbr }: { chassisColor: string; explosionY?: number; pbr?: AllPBRTextures }) {
  const shape = useMemo(() => {
    const w = 4.6
    const d = 3.7
    const r = 0.035
    const x = -w / 2, y = -d / 2
    const chassisShape = new THREE.Shape()

    chassisShape.moveTo(x, y + r)
    chassisShape.lineTo(x, y + d - r)
    chassisShape.quadraticCurveTo(x, y + d, x + r, y + d)
    chassisShape.lineTo(x + w - r, y + d)
    chassisShape.quadraticCurveTo(x + w, y + d, x + w, y + d - r)
    chassisShape.lineTo(x + w, y + r)
    chassisShape.quadraticCurveTo(x + w, y, x + w - r, y)
    chassisShape.lineTo(x + r, y)
    chassisShape.quadraticCurveTo(x, y, x, y + r)

    const tonearmHole = new THREE.Path()
    tonearmHole.absarc(1.64, -1, 0.58, 0, Math.PI * 2, false)
    chassisShape.holes.push(tonearmHole)

    const adapterHole = new THREE.Path()
    adapterHole.absarc(-1.95, -1.45, 0.18, 0, Math.PI * 2, false)
    chassisShape.holes.push(adapterHole)

    const pfX = 2.05, pfY = 1.2, pfW = 0.16, pfH = 1.035
    const pitchHole = new THREE.Path()
    pitchHole.moveTo(pfX - pfW / 2, pfY - pfH / 2)
    pitchHole.lineTo(pfX + pfW / 2, pfY - pfH / 2)
    pitchHole.lineTo(pfX + pfW / 2, pfY + pfH / 2)
    pitchHole.lineTo(pfX - pfW / 2, pfY + pfH / 2)
    pitchHole.closePath()
    chassisShape.holes.push(pitchHole)

    return chassisShape
  }, [])

  const extrudeSettings = { steps: 1, depth: 0.25, bevelEnabled: false, curveSegments: 128 }

  return (
    <group>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1 + explosionY, 0]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        {pbr ? (
          <PowderMetalChassisMaterial textures={pbr.powderMetal} color={chassisColor} />
        ) : (
          <meshStandardMaterial color={chassisColor} roughness={0.4} metalness={0.6} />
        )}
      </mesh>

      {/* FUNDO DO PITCH: Para não parecer um buraco infinito */}
      <mesh position={[2.05, 0.02 + explosionY, 0.8]} castShadow>
        <boxGeometry args={[0.2, 0.01, 1.1]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>
    </group>
  )
}

function RubberBase2({ explosionY = 0 }: { explosionY?: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const w = 4.59, h = 3.69, hw = w / 2, hh = h / 2
    const cn = 0.3, r = 0.04, fr = 0.025
    const bayWidth = 1.6, bayDepth = 0.11, hbw = bayWidth / 2

    s.moveTo(hbw + fr, hh)
    s.quadraticCurveTo(hbw, hh, hbw, hh - fr)
    s.lineTo(hbw, hh - bayDepth + fr)
    s.quadraticCurveTo(hbw, hh - bayDepth, hbw - fr, hh - bayDepth)
    s.lineTo(-hbw + fr, hh - bayDepth)
    s.quadraticCurveTo(-hbw, hh - bayDepth, -hbw, hh - bayDepth + fr)
    s.lineTo(-hbw, hh - fr)
    s.quadraticCurveTo(-hbw, hh, -hbw - fr, hh)
    s.lineTo(-hw + cn + fr, hh)
    s.quadraticCurveTo(-hw + cn, hh, -hw + cn, hh - fr)
    s.lineTo(-hw + cn, hh - cn + fr)
    s.quadraticCurveTo(-hw + cn, hh - cn, -hw + cn - fr, hh - cn)
    s.lineTo(-hw + r, hh - cn)
    s.quadraticCurveTo(-hw, hh - cn, -hw, hh - cn - r)
    s.lineTo(-hw, -hh + cn + r)
    s.quadraticCurveTo(-hw, -hh + cn, -hw + r, -hh + cn)
    s.lineTo(-hw + cn - fr, -hh + cn)
    s.quadraticCurveTo(-hw + cn, -hh + cn, -hw + cn, -hh + cn - fr)
    s.lineTo(-hw + cn, -hh + fr)
    s.quadraticCurveTo(-hw + cn, -hh, -hw + cn + fr, -hh)
    s.lineTo(hw - cn - fr, -hh)
    s.quadraticCurveTo(hw - cn, -hh, hw - cn, -hh + fr)
    s.lineTo(hw - cn, -hh + cn - fr)
    s.quadraticCurveTo(hw - cn, -hh + cn, hw - cn + fr, -hh + cn)
    s.lineTo(hw - r, -hh + cn)
    s.quadraticCurveTo(hw, -hh + cn, hw, -hh + cn + r)
    s.lineTo(hw, hh - cn - r)
    s.quadraticCurveTo(hw, hh - cn, hw - r, hh - cn)
    s.lineTo(hw - cn + fr, hh - cn)
    s.quadraticCurveTo(hw - cn, hh - cn, hw - cn, hh - cn + fr)
    s.lineTo(hw - cn, hh - fr)
    s.quadraticCurveTo(hw - cn, hh, hw - cn - fr, hh)
    s.closePath()

    return s
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32 + explosionY, 0]} castShadow>
      <extrudeGeometry args={[shape, { steps: 1, depth: 0.22, bevelEnabled: false }]} />
      {/* Cor mais escura para combinar com os pés (#050505) */}
      <meshStandardMaterial color="#020202" roughness={0.5} metalness={0.0} />
    </mesh>
  )
}

function RubberBase({ explosionY = 0 }: { explosionY?: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    const w = 4.59, h = 3.69, hw = w / 2, hh = h / 2
    const cn = 0.3, r = 0.04, fr = 0.025
    const bayWidth = 1.6, bayDepth = 0.11, hbw = bayWidth / 2

    // Inicia no canto superior direito interno
    s.moveTo(hw - cn - fr, hh)
    // Borda Superior (agora reta, sem o painel)
    s.lineTo(-hw + cn + fr, hh)
    s.quadraticCurveTo(-hw + cn, hh, -hw + cn, hh - fr)
    s.lineTo(-hw + cn, hh - cn + fr)
    s.quadraticCurveTo(-hw + cn, hh - cn, -hw + cn - fr, hh - cn)
    s.lineTo(-hw + r, hh - cn)
    s.quadraticCurveTo(-hw, hh - cn, -hw, hh - cn - r)
    // Borda Esquerda
    s.lineTo(-hw, -hh + cn + r)
    s.quadraticCurveTo(-hw, -hh + cn, -hw + r, -hh + cn)
    s.lineTo(-hw + cn - fr, -hh + cn)
    s.quadraticCurveTo(-hw + cn, -hh + cn, -hw + cn, -hh + cn - fr)
    s.lineTo(-hw + cn, -hh + fr)
    s.quadraticCurveTo(-hw + cn, -hh, -hw + cn + fr, -hh)
    // Borda Inferior
    s.lineTo(hw - cn - fr, -hh)
    s.quadraticCurveTo(hw - cn, -hh, hw - cn, -hh + fr)
    s.lineTo(hw - cn, -hh + cn - fr)
    s.quadraticCurveTo(hw - cn, -hh + cn, hw - cn + fr, -hh + cn)
    s.lineTo(hw - r, -hh + cn)
    s.quadraticCurveTo(hw, -hh + cn, hw, -hh + cn + r)

    // Borda Direita (COM O NOVO RECORTE DO PAINEL)
    s.lineTo(hw, -hbw - fr)
    s.quadraticCurveTo(hw, -hbw, hw - fr, -hbw)
    s.lineTo(hw - bayDepth + fr, -hbw) // Entra para fazer o buraco
    s.quadraticCurveTo(hw - bayDepth, -hbw, hw - bayDepth, -hbw + fr)
    s.lineTo(hw - bayDepth, hbw - fr)  // Sobe o buraco
    s.quadraticCurveTo(hw - bayDepth, hbw, hw - bayDepth + fr, hbw)
    s.lineTo(hw - fr, hbw)             // Sai do buraco
    s.quadraticCurveTo(hw, hbw, hw, hbw + fr)

    // Finaliza canto superior direito
    s.lineTo(hw, hh - cn - r)
    s.quadraticCurveTo(hw, hh - cn, hw - r, hh - cn)
    s.lineTo(hw - cn + fr, hh - cn)
    s.quadraticCurveTo(hw - cn, hh - cn, hw - cn, hh - cn + fr)
    s.lineTo(hw - cn, hh - fr)
    s.quadraticCurveTo(hw - cn, hh, hw - cn + fr, hh)
    s.closePath()

    return s
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32 + explosionY, 0]} castShadow>
      <extrudeGeometry args={[shape, { steps: 1, depth: 0.22, bevelEnabled: false }]} />
      <meshStandardMaterial color="#020202" roughness={0.5} metalness={0.0} />
    </mesh>
  )
}

function BackPanel() {
  const verticalCenterOffset = -0.02
  // Movemos o painel X = 2.18 (Lateral Direita) e rotacionamos -90º para apontar para fora
  return (
    <group position={[2.18, -0.21, 0]} rotation={[0, Math.PI / 2, 0]}>
      <group>
        <mesh receiveShadow>
          <boxGeometry args={[1.5, 0.21, 0.02]} />
          <meshStandardMaterial color="#0b0b0b" roughness={0.7} metalness={0.2} />
        </mesh>
      </group>

      {/* 1. ÁREA DE ENERGIA */}
      <group position={[-0.55, verticalCenterOffset - 0.015, 0.03]} scale={0.8}>
        <TurntableACSocket scale={0.85} rotation={[0, Math.PI, 0]} />
        <Text position={[0, 0.085, -0.022]} fontSize={0.025} color="#888" fontWeight={700}>AC IN</Text>
      </group>

      {/* 2. USB DO TAMPO */}
      <group position={[-0.25, verticalCenterOffset - 0.025, 0.01]}>
        <TurntableUSBTopDesign />
        <Text position={[0, 0.07, 0.0025]} fontSize={0.025} color="#888" fontWeight={700}>USB</Text>
      </group>

      {/* 3. TERMINAL TERRA (GND) */}
      <group position={[-0.05, verticalCenterOffset, 0.01]}>
        <TurntableGround />
        <Text position={[0.08, 0, 0.0025]} fontSize={0.02} color="#888" anchorX="left" fontWeight={700}>GND</Text>
      </group>

      {/* 4. BLOCO RCA PHONO */}
      <group position={[0.45, verticalCenterOffset, 0]}>
        <mesh position={[0, 0, 0.0105]}>
          <planeGeometry args={[0.56, 0.145]} />
          <meshBasicMaterial color="#333" />
        </mesh>

        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.55, 0.14]} />
          <meshStandardMaterial color="#141414" roughness={0.5} />
        </mesh>

        <group position={[0, 0, 0.017]}>
          <group position={[-0.12, 0, 0]}>
            <TurntableRCA type="red" position={[0, -0.01, 0]} />
            <Text position={[0, 0.05, -0.005]} fontSize={0.018} color="#888" fontWeight={700}>R</Text>
          </group>

          <group position={[0.12, 0, 0]}>
            <TurntableRCA type="white" position={[0, -0.01, 0]} />
            <Text position={[0, 0.05, -0.005]} fontSize={0.018} color="#888" fontWeight={700}>L</Text>
          </group>
          <Text position={[0, -0.048, -0.005]} fontSize={0.02} color="#888" letterSpacing={0.05} fontWeight={700}>
            PHONO OUT
          </Text>
        </group>
      </group>
    </group>
  )
}
export function FeetLayer({ explosionY = 0, textures, pbr }: { explosionY?: number; textures: TurntableTexturesResult; pbr?: AllPBRTextures }) {
  const positions: [number, number, number][] = [
    [-1.95, -0.59 + explosionY, -1.45],
    [1.95, -0.59 + explosionY, -1.45],
    [-1.95, -0.59 + explosionY, 1.45],
    [1.95, -0.59 + explosionY, 1.45],
  ]

  return (
    <>
      {positions.map((pos, i) => (
        <TurntableFoot key={i} position={pos} textures={{ loaded: true }} pbr={pbr} />
      ))}
    </>
  )
}


function TonearmAssembly({ explosionFactorRef, pbr, hardwareFinish = "black", tonearmAngle = 0 }: { explosionFactorRef?: React.RefObject<number>; pbr?: AllPBRTextures; hardwareFinish?: HardwareFinish; tonearmAngle?: number }) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 0, -0.18),
        new THREE.Vector3(0, 0, 0.3),
        new THREE.Vector3(0.015, 0, 0.68),
        new THREE.Vector3(0.24, 0, 1.59),
        new THREE.Vector3(0.018, 0, 1.938),
        new THREE.Vector3(0.02, 0, 1.938),
      ],
      false,
      "centripetal",
      0.4
    )
  }, [])

  const textures = useTurntableTextures()
  const pivotHeight = 0.44

  const bodyGroupRef = useRef<THREE.Group>(null)
  const rearConnectorRef = useRef<THREE.Group>(null)
  const screw1Ref = useRef<THREE.Group>(null)
  const screw2Ref = useRef<THREE.Group>(null)
  const cartRef = useRef<THREE.Group>(null)
  const wiresRef = useRef<THREE.Group>(null)

  // Ref para rotacionar o braço suavemente
  const armSwingRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const ef = explosionFactorRef ? (explosionFactorRef.current ?? 0) : 0
    const t = Math.min(ef * 0.5, 1)
    const screwOffset = 0.8 * t
    const bodyOffset = 0.25 * t

    if (bodyGroupRef.current) bodyGroupRef.current.position.y = 0.09 + bodyOffset
    if (rearConnectorRef.current) rearConnectorRef.current.position.y = bodyOffset * 0.3
    if (screw1Ref.current) screw1Ref.current.position.set(-0.2, 0.14 + screwOffset + bodyOffset, 0.08)
    if (screw2Ref.current) screw2Ref.current.position.set(0.2, 0.14 + screwOffset + bodyOffset, 0.08)
    if (cartRef.current) {
      cartRef.current.position.set(1 * t, -0.04 - 0.35 * t, 0.05 + 1 * t)
    }

    // Animação suave do braço indo para o disco e voltando
    if (armSwingRef.current) {
      armSwingRef.current.rotation.y = THREE.MathUtils.damp(armSwingRef.current.rotation.y, tonearmAngle, 3, delta)
    }
  })

  return (
    <group position={[1.64, 0.02, -1]}>
      <VtaAndGimbalAssembly textures={textures} pbr={pbr} hardwareFinish={hardwareFinish} />

      {/* O Ref armSwingRef controla o giro da base inteira do braço */}
      <group position={[0, pivotHeight, 0]} ref={armSwingRef} rotation={[0, 0, 0]}>
        <group position={[0, 0.04, 0]} rotation={[0, -0.05, Math.PI / 2]}>
          <GimbalMechanism pbr={pbr} />
        </group>

        <group rotation={[0.035, 0, 0]}>
          <Tube args={[curve, 64, 0.046, 32, false]} castShadow>
            {pbr ? (
              <HardwareFinishMaterial finish={hardwareFinish} pbr={pbr} part="tube" />
            ) : (
              <meshPhysicalMaterial color="#050505" roughness={0.1} metalness={0.3} clearcoat={1.0} />
            )}
          </Tube>

          <TonearmPivotSleeve textures={textures} />

          <group position={[0, 0, 0]}>
            <Counterweight textures={textures} pbr={pbr} hardwareFinish={hardwareFinish} />
          </group>

          <group position={[0.05, 0, 1.9]} rotation={[0, 0.89, 0]}>
            <TonearmConnector />
            <group position={[-0.33, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.3}>
              <group ref={bodyGroupRef} position={[0, 0.09, 0.35]}><HeadshellBodyVNL /></group>
              <group ref={rearConnectorRef}><RearConnectorHeadshell /></group>
              <group ref={screw1Ref} position={[-0.2, 0.14, 0.08]}><ExposedScrewHeadshell position={[0, 0, 0]} /></group>
              <group ref={screw2Ref} position={[0.2, 0.14, 0.08]}><ExposedScrewHeadshell position={[0, 0, 0]} /></group>
              <group ref={cartRef} position={[0, -0.04, 0.05]}><VNLCartridge /></group>
              <AnimatedWiresHeadshell explosionFactorRef={explosionFactorRef} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}




export function UnderlowNeonStrip() {
  const cW = 4.58, cD = 3.78, inset = 0.45, neonColor = "#ffb732", tR = 0.015
  const NeonBar = ({ p, rY, l }: any) => (
    <group position={p} rotation={[0, rY, 0]}>
      <mesh position={[0, -0.28 - p[1], 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[tR, tR, l, 16]} /><meshBasicMaterial color={neonColor} toneMapped={false} /></mesh>
      <group position={[0, -0.20 - p[1], 0]}><rectAreaLight width={l} height={0.6} color={neonColor} intensity={80} rotation={[Math.PI / 2, 0, 0]} /></group>
    </group>
  )
  return (
    <group position={[0, 0, 0]}>
      <NeonBar p={[0, 0, cD / 2 - inset]} rY={0} l={cW - inset * 2 - 0.3} />
      <NeonBar p={[0, 0, -(cD / 2) + inset]} rY={0} l={cW - inset * 2 - 0.3} />
      <NeonBar p={[-(cW / 2) + inset, 0, 0]} rY={Math.PI / 2} l={cD - inset * 2 - 0.3} />
      <NeonBar p={[cW / 2 - inset, 0, 0]} rY={Math.PI / 2} l={cD - inset * 2 - 0.3} />
    </group>
  )
}

export function ShadowBlocker() {
  return (
    <group position={[0, -0.151, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.5, 3.6]} />
        <meshStandardMaterial color="#020202" roughness={1} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function Ground() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.2} envMapIntensity={0.2} />
    </mesh>
  )
}

export function StudioFloor() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}><planeGeometry args={[100, 100]} /><shadowMaterial opacity={0.3} color="#000000" /></mesh>
  )
}

// Assembly phases for exploded animation
export interface AssemblyPhase {
  name: string
  startY: number
  scrollStart: number
  scrollEnd: number
  description: string
}

export const ASSEMBLY_PHASES: AssemblyPhase[] = [
  { name: "chassis", startY: 0, scrollStart: 0, scrollEnd: 0.01, description: "Chassis & Base" },
  { name: "feet", startY: 0, scrollStart: 0, scrollEnd: 0.01, description: "Feet" },
  { name: "platter", startY: 0.8, scrollStart: 0.05, scrollEnd: 0.95, description: "Platter" },
  { name: "vinyl", startY: 1.3, scrollStart: 0.05, scrollEnd: 0.95, description: "Vinyl Record" },
  { name: "phase", startY: 1.7, scrollStart: 0.05, scrollEnd: 0.95, description: "Phase Controller" },
  { name: "lights", startY: 0.4, scrollStart: 0.05, scrollEnd: 0.95, description: "Lights" },
  { name: "controls", startY: 0.35, scrollStart: 0.05, scrollEnd: 0.95, description: "Speed Controls" },
  { name: "pitchFader", startY: 0.5, scrollStart: 0.05, scrollEnd: 0.95, description: "Pitch Fader" },
  { name: "tonearm", startY: 1.6, scrollStart: 0.05, scrollEnd: 0.95, description: "Tonearm Assembly" },
  { name: "logos", startY: 0.9, scrollStart: 0.05, scrollEnd: 0.95, description: "Final Details" },
]

// Easing functions
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

// Floating layer component for exploded animation
interface FloatingLayerProps {
  phase: AssemblyPhase
  children: React.ReactNode
  scrollProgress: number
}

export function FloatingLayer({ phase, children, scrollProgress }: FloatingLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!groupRef.current) return
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)
    let p = scrollProgress <= phase.scrollStart ? 0 : scrollProgress >= phase.scrollEnd ? 1 : (scrollProgress - phase.scrollStart) / (phase.scrollEnd - phase.scrollStart)
    groupRef.current.position.y = phase.startY + (0 - phase.startY) * easeOutCubic(p)
  })
  return <group ref={groupRef} position={[0, phase.startY, 0]}>{children}</group>
}

export function TurntableExplodedModel({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const textures = useTurntableTextures()
  const pbr = usePBRTextures()
  if (!textures.loaded) return null

  const chassisPhase = ASSEMBLY_PHASES.find((p) => p.name === "chassis")!
  const feetPhase = ASSEMBLY_PHASES.find((p) => p.name === "feet")!
  const platterPhase = ASSEMBLY_PHASES.find((p) => p.name === "platter")!
  const vinylPhase = ASSEMBLY_PHASES.find((p) => p.name === "vinyl")!
  const phaseControllerPhase = ASSEMBLY_PHASES.find((p) => p.name === "phase")!
  const lightsPhase = ASSEMBLY_PHASES.find((p) => p.name === "lights")!
  const controlsPhase = ASSEMBLY_PHASES.find((p) => p.name === "controls")!
  const pitchFaderPhase = ASSEMBLY_PHASES.find((p) => p.name === "pitchFader")!
  const tonearmPhase = ASSEMBLY_PHASES.find((p) => p.name === "tonearm")!
  const logosPhase = ASSEMBLY_PHASES.find((p) => p.name === "logos")!

  return (
    <group position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <BackPanel />
      <ChassisBottom />
      <RubberBase explosionY={0} />

      <FloatingLayer phase={getPhase("chassis")} scrollProgress={scrollProgress}>
        <ChassisWithHole chassisColor="#1a1a1a" explosionY={0} pbr={pbr} />
        <ShadowBlocker />
        {/* <UnderlowNeonStrip /> */}
        <TonearmBaseRecess textures={textures?.body} chassisColor="#1a1a1a" pbr={pbr} />
      </FloatingLayer>

      <FloatingLayer phase={getPhase("feet")} scrollProgress={scrollProgress}>
        <FeetLayer textures={textures} explosionY={0} pbr={pbr} />
        <Ground />
      </FloatingLayer>

      <FloatingLayer phase={getPhase("platter")} scrollProgress={scrollProgress}><Platter currentSpeed={0} textures={textures} /><Slipmat /></FloatingLayer>
      <FloatingLayer phase={getPhase("vinyl")} scrollProgress={scrollProgress}><group position={[-0.35, 0.15, 0]}><VinylRecord currentSpeed={0} /></group></FloatingLayer>
      <FloatingLayer phase={getPhase("phase")} scrollProgress={scrollProgress}><group position={[-0.35, 0.15, 0]}><group position={[0, 0.068, 0]} scale={2.8}><WirelessController currentSpeed={0} /></group></group></FloatingLayer>

      <FloatingLayer phase={getPhase("lights")} scrollProgress={scrollProgress}>
        <StrobeLight textures={textures?.details} pbr={pbr} />
        <PopupStylusLight textures={textures?.details} pbr={pbr} />
        <Adapter45RPM textures={textures?.details} />
      </FloatingLayer>

      <FloatingLayer phase={getPhase("controls")} scrollProgress={scrollProgress}><SpeedMarkings /><StartStopButton pbr={pbr} /><SpeedButtons pbr={pbr} /></FloatingLayer>
      <FloatingLayer phase={getPhase("pitchFader")} scrollProgress={scrollProgress}><PitchFader textures={textures?.knobs} /></FloatingLayer>
      <FloatingLayer phase={getPhase("tonearm")} scrollProgress={scrollProgress}><TonearmAssembly pbr={pbr} /></FloatingLayer>
      <FloatingLayer phase={getPhase("logos")} scrollProgress={scrollProgress}><ChassisLogos /></FloatingLayer>
    </group>
  )
}

// ============================================================
// INTERACT HINT — Pulso neon nos botões interativos do OUTRO
// Aparece apenas na PRIMEIRA vez que o usuário chega na seção
// ============================================================
const SESSION_KEY = "vox3d_outro_hint_seen"
const PULSE_CYCLES = 4        // número de pulsos antes de sumir
const PULSE_SPEED = 2.8       // velocidade da oscilação (rad/s)
const PULSE_DELAY_START = 0.6  // botão StartStop começa um pouco depois

function InteractHintPulse({
  position,
  color,
  delayOffset = 0,
  timeRef,
}: {
  position: [number, number, number]
  color: string
  delayOffset?: number
  timeRef: React.MutableRefObject<number>
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const t = Math.max(0, timeRef.current - delayOffset)
    if (t <= 0) return

    // Calcula quantos ciclos completados
    const cycleProgress = (t * PULSE_SPEED) / (Math.PI * 2)
    if (cycleProgress > PULSE_CYCLES) {
      if (groupRef.current) groupRef.current.visible = false
      return
    }

    if (groupRef.current) groupRef.current.visible = true

    const pulse = Math.sin(t * PULSE_SPEED)
    const opacity = Math.max(0, pulse) * (1 - cycleProgress / PULSE_CYCLES)
    const scale = 1 + Math.max(0, pulse) * 0.6

    if (matRef.current) {
      matRef.current.opacity = opacity * 0.9
    }
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale)
    }
  })

  // Bolinha circular simples (bullet) que pulsa
  return (
    <group ref={groupRef} position={position} visible={false}>
      <Sphere args={[0.06, 16, 16]}>
        <meshBasicMaterial
          ref={matRef}
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </Sphere>
    </group>
  )
}

function InteractHint({ active }: { active: boolean }) {
  const timeRef = useRef(0)
  const hasStarted = useRef(false)

  useFrame((_, delta) => {
    if (!active || !hasStarted.current) return
    timeRef.current += delta
  })

  // Inicia o timer quando fica ativo pela primeira vez
  useEffect(() => {
    if (active && !hasStarted.current) {
      hasStarted.current = true
      timeRef.current = 0
    }
  }, [active])

  if (!active) return null

  return (
    <>
      {/* Bullet pulsante no PopupStylusLight (botão PointLight) */}
      <InteractHintPulse
        position={[-2.0, 0.18, 1.3]}
        color="#00ff88"
        delayOffset={0}
        timeRef={timeRef}
      />
      {/* Bullet pulsante no StartStopButton */}
      <InteractHintPulse
        position={[-2.07, 0.16, 1.65]}
        color="#00ff88"
        delayOffset={PULSE_DELAY_START}
        timeRef={timeRef}
      />
    </>
  )
}

export function TurntableModel({ chassisColor, isPlaying = false, explosionFactor = 0, explosionFactorRef, hardwareFinish = "black", vinylColor = "#050505", powerOn = true, currentSpeed, tonearmAngle = 0, onTogglePower, onToggleStart }: any) {
  const textures = useTurntableTextures()
  const pbr = usePBRTextures()

  // Hint de interação — só aparece na primeira vez que o usuário chega no OUTRO
  const [hintActive, setHintActive] = useState(false)
  const outroSec = SCROLL_SECTIONS.outro as { start: number; end: number }

  useEffect(() => {
    // Já viu o hint nesta sessão? Não mostra novamente
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return

    const unsubscribe = useScrollStore.subscribe((state) => {
      if (state.progress >= outroSec.start && !sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, "1")
        setHintActive(true)
      }
    })
    return () => unsubscribe()
  }, [outroSec.start])

  const chassisRef = useRef<THREE.Group>(null)
  const platterWellRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<THREE.Group>(null)
  const pitchRef = useRef<THREE.Group>(null)
  const logosRef = useRef<THREE.Group>(null)
  const slipmapRef = useRef<THREE.Group>(null)
  const platterRef = useRef<THREE.Group>(null)
  const vinylRef = useRef<THREE.Group>(null)
  const labelRef = useRef<THREE.Group>(null)
  const tonearmRef = useRef<THREE.Group>(null)

  const localEfRef = useRef(0)

  useFrame((_, delta) => {
    const target = explosionFactorRef ? (explosionFactorRef.current ?? 0) : explosionFactor
    const diff = target - localEfRef.current
    if (Math.abs(diff) < 0.0005 && Math.abs(localEfRef.current) < 0.0005) return
    localEfRef.current = THREE.MathUtils.lerp(localEfRef.current, target, 1 - Math.pow(0.001, delta))
    const ef = localEfRef.current

    if (chassisRef.current) chassisRef.current.position.y = ef * 0.5
    if (platterWellRef.current) platterWellRef.current.position.y = ef * 0.5
    if (controlsRef.current) controlsRef.current.position.y = ef * 0.5 + ef * 0.25
    if (pitchRef.current) pitchRef.current.position.y = ef * 0.5 + ef * 0.35
    if (logosRef.current) logosRef.current.position.y = ef * 0.5 + ef * 0.15
    if (slipmapRef.current) slipmapRef.current.position.y = ef * 0.5 + ef * 0.4
    if (platterRef.current) platterRef.current.position.y = ef * 0.5 + ef * 0.4
    if (vinylRef.current) { vinylRef.current.position.y = 0.15 + ef * 0.5 + ef * 0.8 }
    if (labelRef.current) { labelRef.current.position.y = 0.15 + ef * 0.5 + ef * 1.2 }
    if (tonearmRef.current) {
      tonearmRef.current.position.x = ef * 0.3
      tonearmRef.current.position.y = ef * 0.5 + ef * 1.0
      tonearmRef.current.position.z = -ef * 0.2
    }
  })

  if (!textures.loaded) return null

  // Usa o speed e angle que vem do SceneManager
  const effectiveSpeed = currentSpeed || 0;

  return (
    <group>
      <group>
        <RubberBase explosionY={0} />
        {/* <ChassisBottom />*/}
        <BackPanel />
        {[[-1.95, -0.59, -1.45], [1.95, -0.59, -1.45], [-1.95, -0.59, 1.45], [1.95, -0.59, 1.45]].map((pos, i) => (
          <TurntableFoot key={i} position={pos as [number, number, number]} pbr={pbr} />
        ))}
      </group>
      <group ref={chassisRef}>
        <ChassisWithHole chassisColor={chassisColor} pbr={pbr} />
        <ShadowBlocker chassisColor={chassisColor} />
      </group>
      <group ref={platterWellRef}>
        <TonearmBaseRecess textures={textures?.body} chassisColor={chassisColor} pbr={pbr} />
        <Adapter45RPM textures={textures?.details} />
        <PlatterWell textures={textures} chassisColor={chassisColor} pbr={pbr} />
      </group>
      <group ref={controlsRef}>
        <PopupStylusLight textures={textures?.details} pbr={pbr} powerOn={powerOn} onTogglePower={onTogglePower} />
        <StrobeLight textures={textures?.details} pbr={pbr} powerOn={powerOn} />
        <SpeedMarkings />
        <StartStopButton pbr={pbr} onToggleStart={onToggleStart} />
        <SpeedButtons pbr={pbr} />
      </group>
      <group ref={pitchRef}><PitchFader textures={textures?.knobs} /></group>
      <group ref={logosRef} ><ChassisLogos /><MetallicLogo /></group>
      <group ref={slipmapRef}><Slipmat /></group>
      <group ref={platterRef}><Platter currentSpeed={effectiveSpeed} textures={textures} /></group>
      <group ref={vinylRef} position={[-0.35, 0.15, 0]}><VinylRecord currentSpeed={effectiveSpeed} vinylColor={vinylColor} /></group>
      <group ref={labelRef} position={[-0.35, 0.15, 0]}><group position={[0, 0.068, 0]} scale={2.8}><WirelessController currentSpeed={effectiveSpeed} /></group></group>
      <group ref={tonearmRef}>
        <TonearmAssembly explosionFactorRef={explosionFactorRef} pbr={pbr} hardwareFinish={hardwareFinish} tonearmAngle={tonearmAngle} />
      </group>

      {/* Hint de interação — pulso neon nos botões, só na primeira visita ao OUTRO */}
      <InteractHint active={hintActive} />
    </group>
  )
}
