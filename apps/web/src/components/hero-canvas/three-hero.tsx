"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  const shapes = useMemo(() => {
    const geo = [
      new THREE.TetrahedronGeometry(0.6, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.TorusGeometry(0.4, 0.15, 12, 18),
      new THREE.BoxGeometry(0.45, 0.45, 0.45),
    ];
    const positions = [
      [-3.5, 1.2, -2],
      [2.8, -1.5, -1],
      [-1.2, 2.8, -3],
      [4, 0.5, -4],
      [-4.2, -1, -1.5],
      [1.5, -2.5, -2.5],
      [-2.8, -2, -3.5],
      [3.2, 2.2, -2.5],
    ];
    const colors = [
      "#6366f1",
      "#818cf8",
      "#f59e0b",
      "#fb7185",
      "#a78bfa",
      "#fbbf24",
      "#6366f1",
      "#fb7185",
    ];
    return positions.map((pos, i) => ({
      geometry: geo[i % geo.length],
      position: pos as [number, number, number],
      color: colors[i % colors.length],
      speed: 0.3 + Math.random() * 0.4,
      scale: 0.5 + Math.random() * 0.6,
    }));
  }, []);

  useFrame(({ pointer }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0004;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        pointer.y * 0.05,
        0.02
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        -pointer.x * 0.03,
        0.02
      );
    }
  });

  return (
    <group ref={groupRef}>
      {shapes.map((s, i) => (
        <Float key={i} speed={s.speed} rotationIntensity={0.6} floatIntensity={0.8}>
          <mesh geometry={s.geometry} scale={s.scale} position={s.position}>
            <MeshDistortMaterial
              color={s.color}
              transparent
              opacity={0.35}
              roughness={0.2}
              metalness={0.1}
              distort={0.15}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <color attach="background" args={["#0f0e2e"]} />
      <fog attach="fog" args={["#0f0e2e", 8, 18]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#818cf8" />
      <directionalLight position={[-5, -3, 5]} intensity={0.4} color="#fbbf24" />
      <Scene />
    </>
  );
}

function Fallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0f0e2e 0%, #1e1b4b 100%)",
      }}
    />
  );
}

export default function ThreeHero({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Suspense fallback={<Fallback />}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
