"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function SceneLight() {
  const groupRef = useRef<THREE.Group>(null);

  const shapes = useMemo(() => {
    const geo = [
      new THREE.TetrahedronGeometry(0.5, 0),
      new THREE.OctahedronGeometry(0.4, 0),
      new THREE.IcosahedronGeometry(0.45, 0),
      new THREE.TorusGeometry(0.3, 0.12, 10, 16),
    ];
    const positions = [
      [-3, 1, -3],
      [2.5, -1.2, -2],
      [-1, 2.2, -4],
      [3.5, 0.3, -5],
      [-3.8, -0.8, -2.5],
      [1.2, -2, -3.5],
    ];
    const colors = [
      "#6366f1",
      "#818cf8",
      "#f59e0b",
      "#a78bfa",
      "#c084fc",
      "#fbbf24",
    ];
    return positions.map((pos, i) => ({
      geometry: geo[i % geo.length],
      position: pos as [number, number, number],
      color: colors[i % colors.length],
      speed: 0.2 + Math.random() * 0.3,
      scale: 0.4 + Math.random() * 0.5,
    }));
  }, []);

  useFrame(({ pointer }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        pointer.y * 0.03,
        0.015
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        -pointer.x * 0.02,
        0.015
      );
    }
  });

  return (
    <group ref={groupRef}>
      {shapes.map((s, i) => (
        <Float key={i} speed={s.speed} rotationIntensity={0.4} floatIntensity={0.5}>
          <mesh geometry={s.geometry} scale={s.scale} position={s.position}>
            <MeshDistortMaterial
              color={s.color}
              transparent
              opacity={0.18}
              roughness={0.3}
              metalness={0.05}
              distort={0.12}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function SceneContentLight() {
  return (
    <>
      <color attach="background" args={["#f8f6f2"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#818cf8" />
      <directionalLight position={[-5, -3, 5]} intensity={0.3} color="#fbbf24" />
      <SceneLight />
    </>
  );
}

function Fallback() {
  return null;
}

export default function ThreeHeroLight({ className }: { className?: string }) {
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
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 1.2]}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <SceneContentLight />
        </Canvas>
      </Suspense>
    </div>
  );
}
