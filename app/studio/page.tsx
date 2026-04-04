'use client'

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Environment, ContactShadows, useTexture, Preload, CubicBezierLine } from '@react-three/drei'
import { TurntableModel } from '@/app/studio/turntable'
// import { TurntableModel } from '@/components/turntable-3d'
import { MixerV0X3D } from '@/components/mixer-3d'

import * as THREE from 'three'


const ENVIRONMENT_COLOR = "#000000";

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



function DJSetupCables() {

  // =========================================================
  // LADO ESQUERDO (TT1): 
  // =========================================================
  const hWhiteLeft = -0.96; const zWhiteLeft = -0.35;
  const hRedLeft = -0.93; const zRedLeft = -0.3;
  const hPowerLeft = -0.999; const zPowerLeft = -0.25;

  // =========================================================
  // LADO DIREITO (TT2): 
  // =========================================================
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

export default function CenarioPage() {
  return (
    <div className="w-full h-screen relative">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 1.2
        }}
        camera={{ position: [1.5, 1, 0], fov: 50 }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={[ENVIRONMENT_COLOR]} />
          <fog attach="fog" args={[ENVIRONMENT_COLOR, 6, 15]} />

          {/*
          <Environment
            files="/hdr/suburban_soccer_park_1k.hdr"
            environmentIntensity={0.6} blur={1}
          />

*/}
          <Environment
            files="/hdr/white_home_studio_1k.hdr"
            environmentIntensity={0.2} blur={1}
          />

          {/*
          <directionalLight
            castShadow
            position={[1, 2, 1]}
            intensity={2.6}
            shadow-mapSize={[2048, 2048]}
          />
*/}

          <directionalLight
            castShadow
            position={[1, 10, 5]}
            intensity={2}
            color="#ffffff"
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0003}
          >

            <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.1, 100]} />
          </directionalLight>


          <StageFloor />

          <group position={[0, 1, -0.36]}>
            <DJSetupCables />
          </group>


          <group position={[-3.1, 0.589, 0]} rotation={[0, Math.PI / 2, 0]} >
            <TurntableModel
              chassisColor="#1a1a1a"
              isPlaying={false}
              explosionFactor={0}
            />
          </group>


          <group position={[0, 0.684, 0.35]} scale={[1.1, 1.1, 1.1]}>
            <MixerV0X3D />
          </group>


          <group position={[3.1, 0.589, 0]} rotation={[0, Math.PI / 2, 0]} >
            <TurntableModel
              chassisColor="#1a1a1a"
              isPlaying={false}
              explosionFactor={0}
            />
          </group>



          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.85}
            scale={30}
            frames={1}
            blur={0.45}
            far={6}
            resolution={1024}
            color="#000000"
          />

          <OrbitControls
            makeDefault
            minDistance={3.1}
            maxDistance={10}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2.5}
            enableDamping={true}
            enablePan={false}
          />
        </Suspense>
        <Preload all />
      </Canvas>
    </div >
  )
}


function StageFloor() {
  //  const normalMap = useTexture("/textures/cracked_concrete_norgl.jpg");
  const normalMap = useTexture("/textures/txr.webp");

  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(30, 35);
  normalMap.anisotropy = 8;

  const material = new THREE.MeshStandardMaterial({
    roughness: 0.8,
    color: ENVIRONMENT_COLOR,
    normalMap: normalMap,
  });

  return (
    <mesh
      castShadow
      receiveShadow
      position={[0, -0.005, 0]}
      rotation={[-Math.PI / 2, 0, 1]}
      material={material}
    >
      <circleGeometry args={[25, 25]} />
    </mesh>
  );
}


