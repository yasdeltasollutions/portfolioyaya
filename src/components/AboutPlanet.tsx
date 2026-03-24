import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ABOUT_PLANET_TEXTURE_SEEDS,
  BACKGROUND_MATCH_SPIN_Y,
  SITE_PLANET_PALETTES,
  type PlanetTextureVariant,
  createPlanetTextureCanvas,
  planetMaterialStyle,
} from '@/lib/aboutPlanetTextures';
import {
  getCameraTarget,
  getPlanetLayout,
  PLANET_RADII,
  type PlanetFocusIndex,
} from '@/lib/aboutPlanetLayout';

const TEXTURE_VARIANTS: PlanetTextureVariant[] = ['gas-orange', 'gas-pink', 'jupiter-purple'];

const DRAG_SENS = 0.009;
const CLICK_DRAG_PX = 8;

const FOCUS_COPY: { title: string; body: string }[] = [
  {
    title: 'Trajetória & stack',
    body: 'Formação em ADS e foco em front-end moderno: React, TypeScript e interfaces responsivas, com atenção a performance e acessibilidade.',
  },
  {
    title: 'O que me move',
    body: 'Criar experiências visuais e interativas — animações, WebGL e Canvas — com código limpo e escalável.',
  },
  {
    title: 'Visão',
    body: 'Projetos próprios com boas práticas, componentização e arquitetura front-end sólida para crescer com o produto.',
  },
];

/** Câmara em perspetiva (não ortográfica) — evita zoom/left-right errados que “apagam” a cena. */
function CameraRig({ focusIndex }: { focusIndex: PlanetFocusIndex | null }) {
  const { camera } = useThree();
  const lookRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const target = getCameraTarget(focusIndex);
    const k = 1 - Math.exp(-2.8 * delta);
    camera.position.lerp(target, k);

    const lookTarget =
      focusIndex === null
        ? new THREE.Vector3(0, 0, 0)
        : getPlanetLayout(focusIndex, focusIndex).position;
    lookRef.current.lerp(lookTarget, k);
    camera.lookAt(lookRef.current);
  });

  return null;
}

function InteractivePlanet({
  planetIndex,
  palette,
  textureSeed,
  textureVariant,
  baseRadius,
  focusIndex,
  onPlanetTap,
}: {
  planetIndex: PlanetFocusIndex;
  palette: (typeof SITE_PLANET_PALETTES)[number];
  textureSeed: number;
  textureVariant: PlanetTextureVariant;
  baseRadius: number;
  focusIndex: PlanetFocusIndex | null;
  onPlanetTap: (index: PlanetFocusIndex) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const animInit = useRef(false);
  const dragging = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const { gl } = useThree();
  const mat = planetMaterialStyle(textureVariant);

  const texture = useMemo(() => {
    const canvas = createPlanetTextureCanvas(palette, textureSeed, textureVariant);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [palette, textureSeed, textureVariant]);

  useFrame((_, delta) => {
    if (!groupRef.current || !meshRef.current) return;
    meshRef.current.rotation.y += BACKGROUND_MATCH_SPIN_Y * delta;

    const { position, scaleMul, opacity } = getPlanetLayout(focusIndex, planetIndex);
    const targetScale = baseRadius * scaleMul;
    const matStd = meshRef.current.material as THREE.MeshStandardMaterial;

    if (!animInit.current) {
      groupRef.current.position.copy(position);
      groupRef.current.scale.setScalar(targetScale);
      matStd.opacity = Math.max(0.05, opacity);
      matStd.transparent = opacity < 0.999;
      matStd.depthWrite = opacity > 0.5;
      animInit.current = true;
      return;
    }

    const k = 1 - Math.exp(-6 * delta);
    groupRef.current.position.lerp(position, k);
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, k);
    groupRef.current.scale.setScalar(s);
    const nextOp = THREE.MathUtils.lerp(matStd.opacity, Math.max(0.05, opacity), k);
    matStd.opacity = nextOp;
    matStd.transparent = nextOp < 0.999;
    matStd.depthWrite = nextOp > 0.5;
  });

  const setCanvasCursor = (c: string) => {
    gl.domElement.style.cursor = c;
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragging.current = true;
    hasDragged.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    last.current = { x: e.clientX, y: e.clientY };
    setCanvasCursor('grabbing');

    const onWindowMove = (ev: PointerEvent) => {
      if (!dragging.current || !meshRef.current) return;
      const dist = Math.hypot(ev.clientX - pointerStart.current.x, ev.clientY - pointerStart.current.y);
      if (dist > CLICK_DRAG_PX) hasDragged.current = true;
      const dx = ev.clientX - last.current.x;
      const dy = ev.clientY - last.current.y;
      last.current = { x: ev.clientX, y: ev.clientY };
      meshRef.current.rotation.y += dx * DRAG_SENS;
      meshRef.current.rotation.x += dy * DRAG_SENS;
    };

    const onWindowUp = () => {
      if (dragging.current && !hasDragged.current) {
        onPlanetTap(planetIndex);
      }
      dragging.current = false;
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      setCanvasCursor('grab');
    };

    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowUp);
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerDown={onPointerDown}
        onPointerOver={() => {
          if (!dragging.current) setCanvasCursor('grab');
        }}
        onPointerOut={() => {
          if (!dragging.current) setCanvasCursor('default');
        }}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={mat.roughness}
          metalness={mat.metalness}
          emissive={mat.emissive}
          emissiveIntensity={mat.emissiveIntensity}
          opacity={1}
          transparent
        />
      </mesh>
    </group>
  );
}

function Scene({
  focusIndex,
  onPlanetTap,
}: {
  focusIndex: PlanetFocusIndex | null;
  onPlanetTap: (index: PlanetFocusIndex) => void;
}) {
  return (
    <>
      <CameraRig focusIndex={focusIndex} />
      <ambientLight intensity={0.48} />
      <directionalLight position={[12, 8, 10]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, 4, -4]} intensity={0.22} color="#ddd6fe" />
      {([0, 1, 2] as const).map((i) => (
        <InteractivePlanet
          key={i}
          planetIndex={i}
          palette={SITE_PLANET_PALETTES[i]}
          textureSeed={ABOUT_PLANET_TEXTURE_SEEDS[i]}
          textureVariant={TEXTURE_VARIANTS[i]}
          baseRadius={PLANET_RADII[i]}
          focusIndex={focusIndex}
          onPlanetTap={onPlanetTap}
        />
      ))}
    </>
  );
}

export default function AboutPlanet() {
  const [focusIndex, setFocusIndex] = useState<PlanetFocusIndex | null>(null);

  const onPlanetTap = (index: PlanetFocusIndex) => {
    setFocusIndex((prev) => (prev === index ? null : index));
  };

  const copy = focusIndex !== null ? FOCUS_COPY[focusIndex] : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
      <aside
        className={`shrink-0 transition-all duration-500 ease-out lg:max-w-md ${
          focusIndex !== null
            ? 'pointer-events-auto max-h-[min(50vh,28rem)] overflow-y-auto opacity-100 lg:w-[min(100%,22rem)]'
            : 'pointer-events-none max-h-0 overflow-hidden opacity-0 lg:max-w-0 lg:overflow-hidden'
        }`}
        aria-hidden={focusIndex === null}
      >
        {copy && (
          <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-4 text-left backdrop-blur-md sm:px-5 sm:py-5">
            <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{copy.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">{copy.body}</p>
            <button
              type="button"
              className="mt-4 text-sm text-white/65 underline decoration-white/30 underline-offset-4 transition hover:text-white/90"
              onClick={() => setFocusIndex(null)}
            >
              Voltar aos três planetas
            </button>
          </div>
        )}
      </aside>

      <div
        className={`relative min-h-0 min-w-0 w-full flex-1 ${
          focusIndex !== null
            ? 'h-[min(480px,70vh)] sm:h-[min(500px,68vh)]'
            : 'h-[min(380px,52vmin)] sm:h-[420px]'
        }`}
      >
        <Canvas
          camera={{ position: [0, 0.3, 13.5], fov: 45, near: 0.1, far: 200 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(0, 0, 0, 0);
            scene.background = null;
          }}
          className="touch-none [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Scene focusIndex={focusIndex} onPlanetTap={onPlanetTap} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
