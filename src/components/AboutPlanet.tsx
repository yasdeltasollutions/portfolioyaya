import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  getMinIdleCameraZForAspect,
  getPlanetLayout,
  IDLE_CAMERA_Z,
  PLANET_RADII,
  type PlanetFocusIndex,
} from '@/lib/aboutPlanetLayout';

const TEXTURE_VARIANTS: PlanetTextureVariant[] = ['gas-orange', 'gas-pink', 'jupiter-purple'];

const PLANET_NAMES: Record<PlanetFocusIndex, string> = {
  0: 'Trajetória',
  1: 'Stack',
  2: 'Quem Sou',
};

const DRAG_SENS = 0.009;
const CLICK_DRAG_PX = 8;

/** Evita saltos de scroll quando o layout do modo foco aumenta a altura da página. */
function restoreScrollPositionImmediate(y: number) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  html.style.scrollBehavior = prev;
}

const FOCUS_COPY: { title: string; body: string; body2?: string }[] = [
  {
    title: 'Trajetória & stack',
    body: 'Formação em ADS e foco em front-end moderno: React, TypeScript e interfaces responsivas, com atenção a performance e acessibilidade.',
  },
  {
    title: 'O que me move',
    body: 'Criar experiências visuais e interativas — animações, WebGL e Canvas — com código limpo e escalável.',
  },
  {
    title: 'Eu sou',
    body:
      'Desenvolvedora Front-End em formação, sou apaixonada por criar interfaces que não sejam apenas funcionais, mas que também proporcionem boas experiências para quem usa.',
    body2:
      'Gosto de transformar ideias em soluções visuais bem estruturadas, sempre buscando evoluir tecnicamente e aprimorar a forma como construo cada detalhe — da interação à performance.',
  },
];

/** ~45°: FOV muito alto (ex.: 90°+) distorce a perspetiva e as esferas parecem elipses horizontais. */
const FOV_DEFAULT = 45;
/** Ligeiramente mais aberto no modo foco; ainda moderado para o disco continuar redondo. */
const FOV_FOCUS = 50;

/**
 * Centro do planeta em foco em NDC: x → direita. Valor alto = máximo para a direita do ecrã
 * (maior parte do disco à direita / fora do canvas). y fixo moderado para não cortar em baixo.
 */
/** y menos negativo = disco mais alto no canvas, folga em baixo para a curva não cortar. */
// y mais negativo = mais baixo no canvas; FOV_FOCUS maior garante folga para não cortar em baixo.
// Descer bem mais a projeção vertical do planeta no canvas.
// Desce ainda mais: y mais negativo aproxima a projeção do centro do planeta ao canto inferior direito.
// Mais abaixo no canvas
// Mais para a direita no canvas
// Menos negativo para evitar cortar a base do planeta.
// Menos negativo para evitar cortar a base do planeta.
// Subir um pouco para não cortar a base do planeta.
// Subir um pouco (menos negativo) para não cortar a base.
/**
 * Pedido “extremo” de canto inferior direito: o clamp por raio usa o intervalo válido e escolhe
 * o máximo à direita (maxX) e o mais baixo possível (minY) sem cortar o disco.
 */
const FOCUS_PLANET_NDC = new THREE.Vector2(8, -9);
/** Folga mínima no limite NDC; valores maiores afastam o disco do canto. */
const FOCUS_NDC_PADDING = 0.09;

const NDC_LOOK_ITERS = 90;
const NDC_LOOK_GAIN = 1.98;

/** Câmara em perspetiva (não ortográfica) — evita zoom/left-right errados que “apagam” a cena. */
function CameraRig({ focusIndex }: { focusIndex: PlanetFocusIndex | null }) {
  const { camera, gl } = useThree();
  const lookRef = useRef(new THREE.Vector3(0, 0, 0));
  const lookScratch = useRef(new THREE.Vector3(0, 0, 0));
  const lookWork = useRef(new THREE.Vector3(0, 0, 0));
  const projScratch = useRef(new THREE.Vector3(0, 0, 0));
  const projRightScratch = useRef(new THREE.Vector3(0, 0, 0));
  const projLeftScratch = useRef(new THREE.Vector3(0, 0, 0));
  const projUpScratch = useRef(new THREE.Vector3(0, 0, 0));
  const projDownScratch = useRef(new THREE.Vector3(0, 0, 0));
  const basisRight = useRef(new THREE.Vector3(0, 0, 0));
  const basisUp = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const p = camera as THREE.PerspectiveCamera;
    const el = gl.domElement;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw > 0 && ch > 0) {
      const ar = cw / ch;
      if (Math.abs(p.aspect - ar) > 1e-7) p.aspect = ar;
    }

    const target = getCameraTarget(focusIndex);
    if (focusIndex === null && cw > 0 && ch > 0) {
      const minZ = getMinIdleCameraZForAspect(cw / ch);
      target.z = Math.max(target.z, minZ);
    }
    const k = 1 - Math.exp(-2.8 * delta);
    camera.position.lerp(target, k);

    const targetFov = focusIndex === null ? FOV_DEFAULT : FOV_FOCUS;
    const kf = 1 - Math.exp(-3 * delta);
    p.fov = THREE.MathUtils.lerp(p.fov, targetFov, kf);
    p.updateProjectionMatrix();

    if (focusIndex === null) {
      lookScratch.current.set(0, 0, 0);
      lookRef.current.lerp(lookScratch.current, k);
      camera.lookAt(lookRef.current);
      p.updateProjectionMatrix();
      return;
    }

    const { position: planetWorld, scaleMul } = getPlanetLayout(focusIndex, focusIndex);
    const planetRadiusWorld = PLANET_RADII[focusIndex] * scaleMul;
    lookWork.current.copy(planetWorld);

    /**
     * Só alinhar o *centro* ao NDC deixa metade do disco fora do quadrado visível: a projeção
     * corta em linhas retas (base/direita) — não é bug da esfera, é clip do viewport WebGL em |y|>1.
     * Aqui calculamos a extensão NDC do disco e puxamos o alvo para dentro do retângulo válido.
     */
    for (let iter = 0; iter < NDC_LOOK_ITERS; iter++) {
      camera.lookAt(lookWork.current);
      camera.updateMatrixWorld();
      p.updateProjectionMatrix();
      basisRight.current.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      basisUp.current.setFromMatrixColumn(camera.matrixWorld, 1).normalize();

      projScratch.current.copy(planetWorld).project(camera);
      projRightScratch.current
        .copy(planetWorld)
        .addScaledVector(basisRight.current, planetRadiusWorld)
        .project(camera);
      projLeftScratch.current
        .copy(planetWorld)
        .addScaledVector(basisRight.current, -planetRadiusWorld)
        .project(camera);
      projUpScratch.current
        .copy(planetWorld)
        .addScaledVector(basisUp.current, planetRadiusWorld)
        .project(camera);
      projDownScratch.current
        .copy(planetWorld)
        .addScaledVector(basisUp.current, -planetRadiusWorld)
        .project(camera);

      const extentRight = Math.abs(projRightScratch.current.x - projScratch.current.x);
      const extentLeft = Math.abs(projLeftScratch.current.x - projScratch.current.x);
      const extentUp = Math.abs(projUpScratch.current.y - projScratch.current.y);
      const extentDown = Math.abs(projDownScratch.current.y - projScratch.current.y);

      const pad = FOCUS_NDC_PADDING;
      const minTargetX = -1 + extentLeft + pad;
      const maxTargetX = 1 - extentRight - pad;
      const minTargetY = -1 + extentDown + pad;
      const maxTargetY = 1 - extentUp - pad;

      const minX = Math.min(minTargetX, maxTargetX);
      const maxX = Math.max(minTargetX, maxTargetX);
      const minY = Math.min(minTargetY, maxTargetY);
      const maxY = Math.max(minTargetY, maxTargetY);
      const clampedTargetX = THREE.MathUtils.clamp(FOCUS_PLANET_NDC.x, minX, maxX);
      const clampedTargetY = THREE.MathUtils.clamp(FOCUS_PLANET_NDC.y, minY, maxY);

      const errX = clampedTargetX - projScratch.current.x;
      const errY = clampedTargetY - projScratch.current.y;
      if (Math.abs(errX) < 0.001 && Math.abs(errY) < 0.001) break;

      lookWork.current.addScaledVector(basisRight.current, -errX * NDC_LOOK_GAIN);
      lookWork.current.addScaledVector(basisUp.current, -errY * NDC_LOOK_GAIN);
    }
    camera.lookAt(lookWork.current);
    p.updateProjectionMatrix();
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

      <Html
        position={[0, 1.22, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: focusIndex === planetIndex ? '42px' : '13px',
            fontWeight: focusIndex === planetIndex ? 700 : 600,
            letterSpacing: '0.04em',
            fontFamily: 'Sora, sans-serif',
            textShadow: '0 1px 8px rgba(0,0,0,0.55)',
            transition: 'font-size 0.5s ease, font-weight 0.5s ease',
          }}
        >
          {PLANET_NAMES[planetIndex]}
        </span>
      </Html>
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
  const scrollYToRestore = useRef<number | null>(null);

  const beginFocusLayoutChange = () => {
    scrollYToRestore.current = window.scrollY;
  };

  useLayoutEffect(() => {
    if (scrollYToRestore.current === null) return;
    const y = scrollYToRestore.current;
    scrollYToRestore.current = null;
    restoreScrollPositionImmediate(y);
    requestAnimationFrame(() => restoreScrollPositionImmediate(y));
  }, [focusIndex]);

  const onPlanetTap = (index: PlanetFocusIndex) => {
    beginFocusLayoutChange();
    setFocusIndex((prev) => (prev === index ? null : index));
  };

  const copy = focusIndex !== null ? FOCUS_COPY[focusIndex] : null;

  return (
    <div
      className={`mx-auto flex w-full flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10 ${
        focusIndex !== null
          ? 'mb-52 sm:mb-40 lg:mb-32 max-w-none -mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)]'
          : 'max-w-6xl'
      }`}
    >
      <aside
        className={`shrink-0 transition-all duration-500 ease-out ${
          focusIndex !== null
            ? 'pointer-events-auto w-full max-w-[min(100%,46rem)] overflow-visible opacity-100 pl-4 pr-5 sm:pl-5 sm:pr-6 sm:ml-12 md:ml-16 lg:ml-24 lg:max-w-[min(100%,48rem)] xl:ml-32 2xl:ml-40'
            : 'pointer-events-none max-h-0 overflow-hidden opacity-0 lg:max-w-0 lg:overflow-hidden'
        }`}
        aria-hidden={focusIndex === null}
      >
        {copy && (
          <div className="mt-6 w-full max-w-full pt-4 text-left sm:mt-8 sm:pt-6 lg:mt-10 lg:pt-8">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">
              {focusIndex === 2 ? (
                <span className="inline-block text-gradient-neon">{copy.title}</span>
              ) : (
                <span className="text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.75)]">{copy.title}</span>
              )}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-white/90 [text-shadow:0_1px_18px_rgba(0,0,0,0.75)] sm:mt-4 sm:text-lg lg:text-xl">
              {copy.body}
            </p>
            {copy.body2 ? (
              <p className="mt-3 text-base leading-relaxed text-white/90 [text-shadow:0_1px_18px_rgba(0,0,0,0.75)] sm:mt-4 sm:text-lg lg:text-xl">
                {copy.body2}
              </p>
            ) : null}
          </div>
        )}
      </aside>

      <div
        className={`relative min-h-0 min-w-0 w-full flex-1 ${
          focusIndex !== null
            ? 'min-h-[52rem] h-[min(104vh,1120px)] pb-32 sm:min-h-[56rem] sm:h-[min(102vh,1180px)] sm:pb-36 lg:min-h-[58rem] lg:h-[min(100vh,1220px)] lg:pb-40 overflow-visible'
            : 'h-[min(540px,72vmin)] sm:h-[580px]'
        }`}
      >
        <Canvas
          camera={{ position: [0, 0.3, IDLE_CAMERA_Z], fov: FOV_DEFAULT, near: 0.1, far: 200 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          onCreated={({ gl, scene }) => {
            gl.setClearColor('#000000', 0);
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
