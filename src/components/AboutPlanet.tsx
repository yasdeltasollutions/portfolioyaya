import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ABOUT_PLANET_TEXTURE_SEEDS,
  BACKGROUND_MATCH_SPIN_Y,
  SITE_PLANET_PALETTES,
  type PlanetTextureVariant,
  createPlanetTextureCanvas,
  planetMaterialStyle,
} from '@/lib/aboutPlanetTextures';

const PLANETS: {
  palette: (typeof SITE_PLANET_PALETTES)[number];
  variant: PlanetTextureVariant;
  seed: number;
  sizeMult: number;
  viewportClass: string;
}[] = [
  {
    palette: SITE_PLANET_PALETTES[0],
    variant: 'gas-orange',
    seed: ABOUT_PLANET_TEXTURE_SEEDS[0],
    sizeMult: 1.4,
    viewportClass: 'h-[min(240px,32vw)] min-h-[160px]',
  },
  {
    palette: SITE_PLANET_PALETTES[1],
    variant: 'gas-pink',
    seed: ABOUT_PLANET_TEXTURE_SEEDS[1],
    sizeMult: 1.6,
    viewportClass: 'h-[min(260px,34vw)] min-h-[170px]',
  },
  {
    palette: SITE_PLANET_PALETTES[2],
    variant: 'jupiter-purple',
    seed: ABOUT_PLANET_TEXTURE_SEEDS[2],
    sizeMult: 2,
    viewportClass: 'h-[min(280px,36vw)] min-h-[180px]',
  },
];

const BASE_RADIUS = 0.75;
const CAMERA_Z = 6.8;

function Planet({
  radius,
  textureSeed,
  variant,
  palette,
}: {
  radius: number;
  textureSeed: number;
  variant: PlanetTextureVariant;
  palette: (typeof SITE_PLANET_PALETTES)[number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mat = planetMaterialStyle(variant);

  const texture = useMemo(() => {
    const canvas = createPlanetTextureCanvas(palette, textureSeed, variant);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [palette, textureSeed, variant]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += BACKGROUND_MATCH_SPIN_Y * delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={mat.roughness}
        metalness={mat.metalness}
        emissive={mat.emissive}
        emissiveIntensity={mat.emissiveIntensity}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

function PlanetViewport({
  palette,
  textureSeed,
  variant,
  sizeMult,
  viewportClass,
}: {
  palette: (typeof SITE_PLANET_PALETTES)[number];
  textureSeed: number;
  variant: PlanetTextureVariant;
  sizeMult: number;
  viewportClass: string;
}) {
  const radius = BASE_RADIUS * sizeMult;

  return (
    <div
      className={`w-full min-w-0 flex-1 select-none ${viewportClass}`}
      style={{ background: 'transparent' }}
    >
      <Canvas
        camera={{ position: [0, 0, CAMERA_Z], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0, 0, 0, 0);
          scene.background = null;
        }}
        style={{ background: 'transparent', width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.42} />
          <directionalLight position={[14, 6, 10]} intensity={1.28} color="#ffffff" />
          <directionalLight position={[-5, 3, -4]} intensity={0.18} color="#ddd6fe" />
          <Planet radius={radius} textureSeed={textureSeed} variant={variant} palette={palette} />
          <OrbitControls enableZoom={false} makeDefault />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function AboutPlanet() {
  return (
    <div className="flex w-full max-w-[min(100%,90rem)] max-h-[min(72dvh,640px)] flex-row items-center justify-center gap-2 sm:gap-3 md:gap-5 lg:gap-8">
      {PLANETS.map(({ palette, seed, variant, sizeMult, viewportClass }, i) => (
        <PlanetViewport
          key={i}
          palette={palette}
          textureSeed={seed}
          variant={variant}
          sizeMult={sizeMult}
          viewportClass={viewportClass}
        />
      ))}
    </div>
  );
}
