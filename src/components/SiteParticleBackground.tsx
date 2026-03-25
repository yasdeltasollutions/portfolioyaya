import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { useRef, useMemo, Suspense, type ReactNode } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

/* ───────── Custom Planet Shader Material ───────── */
class PlanetShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor1: { value: new THREE.Color('#7B2CBF') },
        uColor2: { value: new THREE.Color('#FF4D8D') },
        uColor3: { value: new THREE.Color('#FF7A18') },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        // simplex-style noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          vec3 pos = position;
          float noise = snoise(pos * 1.5 + uTime * 0.15) * 0.12;
          pos += normal * noise;
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          float t = sin(vUv.y * 3.14159 + uTime * 0.2) * 0.5 + 0.5;
          float t2 = sin(vUv.x * 6.28 + uTime * 0.15) * 0.5 + 0.5;
          vec3 color = mix(uColor1, uColor2, t);
          color = mix(color, uColor3, t2 * 0.4);

          // rim lighting
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
          rim = pow(rim, 3.0);
          color += rim * uColor2 * 0.6;

          // subtle pulse
          float pulse = sin(uTime * 0.8) * 0.05 + 0.95;
          color *= pulse;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }
}

extend({ PlanetShaderMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    planetShaderMaterial: any;
  }
}

/* ───────── Atmosphere (Fresnel Glow) ───────── */
function Atmosphere() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#7B2CBF') },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
        rim = pow(rim, 2.5);
        gl_FragColor = vec4(uColor, rim * 0.55);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
  }), []);

  return (
    <mesh material={mat}>
      <sphereGeometry args={[1.55, 64, 64]} />
    </mesh>
  );
}

/* ───────── Moon ───────── */
function Moon({ radius, speed, size, color }: { radius: number; speed: number; size: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed;
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      ref.current.position.y = Math.sin(t * 0.7) * radius * 0.3;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
    </mesh>
  );
}

/* ───────── Orbital Particles ───────── */
function OrbitalParticles() {
  const count = 120;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 2.2 + Math.random() * 1.2;
      pos[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.4;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.0188;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#FF4D8D" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

/* ───────── Space Dust (deep field particles) — sem interação com o cursor ───────── */
function SpaceDust() {
  const count = 400;
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color('#7B2CBF'), new THREE.Color('#FF4D8D'), new THREE.Color('#FF7A18'), new THREE.Color('#ffffff')];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;

    const dt = state.clock.getDelta();

    const expandSpeed = 20.66;
    const maxRadius = 22;
    const spawnRadius = 2.2;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      let x = positions[ix];
      let y = positions[ix + 1];
      let z = positions[ix + 2];
      const lenSq = x * x + y * y + z * z;
      const len = Math.sqrt(lenSq) || 0.001;
      const warp = Math.min(1 + len * 0.07, 3);
      const step = expandSpeed * warp * dt;

      x += (x / len) * step;
      y += (y / len) * step;
      z += (z / len) * step;

      if (x * x + y * y + z * z > maxRadius * maxRadius) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const r = Math.random() * spawnRadius;
        const sinPhi = Math.sin(phi);
        x = r * sinPhi * Math.cos(theta);
        y = r * sinPhi * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      positions[ix] = x;
      positions[ix + 1] = y;
      positions[ix + 2] = z;
    }

    const posAttr = ref.current.geometry.attributes.position;
    posAttr.needsUpdate = true;
    ref.current.geometry.computeBoundingSphere();
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

/* ───────── Galaxy orbit (spin around scene center = hero / name) ───────── */
function GalaxySpin({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.075;
    groupRef.current.rotation.x = Math.sin(t * 0.0376) * 0.0376;
  });

  return <group ref={groupRef}>{children}</group>;
}

/* ───────── Planet Core ───────── */
function Planet() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.06;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, pointer.y * 0.15, 0.02);
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, pointer.x * 0.3, 0.02);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, pointer.y * 0.15, 0.02);
    }
  });

  return (
    <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.4}>
      <group>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.3, 128, 128]} />
          <planetShaderMaterial ref={matRef} />
        </mesh>
        <Atmosphere />
        <Moon radius={2.4} speed={0.3} size={0.08} color="#FF4D8D" />
        <Moon radius={3.0} speed={0.18} size={0.06} color="#7B2CBF" />
        <Moon radius={2.8} speed={-0.22} size={0.05} color="#FF7A18" />
        <OrbitalParticles />
      </group>
    </Float>
  );
}

/* ───────── Camera Rig ───────── */
function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame(() => {
    const k = 0.059;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.198, k);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.099 + 0.2, k);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ───────── Fundo global: partículas + estrelas a girar (viewport fixo) ───────── */
export default function SiteParticleBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-full" aria-hidden>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#050507']} />
          <fog attach="fog" args={['#050507', 8, 25]} />

          <ambientLight intensity={0.15} />
          <pointLight position={[5, 4, 5]} color="#7B2CBF" intensity={3} distance={15} />
          <pointLight position={[-4, -3, 3]} color="#FF4D8D" intensity={2} distance={12} />
          <pointLight position={[0, 3, -5]} color="#FF7A18" intensity={1.5} distance={10} />

          <GalaxySpin>
            <SpaceDust />
            <Stars radius={60} depth={80} count={1540} factor={3} saturation={0.3} fade speed={0.258} />
          </GalaxySpin>

          <CameraRig />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              intensity={1.2}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
