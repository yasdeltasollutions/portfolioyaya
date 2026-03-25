import * as THREE from 'three';

export type PlanetFocusIndex = 0 | 1 | 2;

/** Raios da esfera base (antes de scaleMul). Maiores que o design inicial (~+55%). */
const SIZE = 1.55;
export const PLANET_RADII = [0.75 * 1.4 * SIZE, 0.75 * 1.6 * SIZE, 0.75 * 2 * SIZE] as const;

const BEHIND = -2.35;
const SM = 0.38;
const OP = 0.44;

/**
 * Layout explícito por (foco, índice) — evita planetas fora do frustum ou sobrepostos.
 * Câmara em perspetiva ~ (0, 0.4, 11–14) olhando para a origem.
 */
export function getPlanetLayout(
  focus: PlanetFocusIndex | null,
  planetIndex: PlanetFocusIndex,
): { position: THREE.Vector3; scaleMul: number; opacity: number } {
  if (focus === null) {
    const x = (planetIndex - 1) * 5.15;
    return {
      position: new THREE.Vector3(x, 0, 0),
      scaleMul: 1,
      opacity: 1,
    };
  }

  if (focus === planetIndex) {
    /** Posição em mundo; o canto no ecrã é fixado em `AboutPlanet` via alvo NDC (responsivo / zoom). */
    return {
      position: new THREE.Vector3(2.55, 0.12, 0.85),
      scaleMul: 3.28,
      opacity: 1,
    };
  }

  /** Tabela: quem fica atrás quando o foco é 0, 1 ou 2 */
  if (focus === 0) {
    if (planetIndex === 1) {
      return { position: new THREE.Vector3(-2.2, 0, BEHIND), scaleMul: SM, opacity: OP };
    }
    return { position: new THREE.Vector3(3.8, -0.05, BEHIND - 0.2), scaleMul: SM, opacity: OP };
  }
  if (focus === 1) {
    if (planetIndex === 0) {
      return { position: new THREE.Vector3(-5.2, -0.05, BEHIND), scaleMul: SM, opacity: OP };
    }
    return { position: new THREE.Vector3(5.2, -0.05, BEHIND), scaleMul: SM, opacity: OP };
  }
  /* focus === 2 */
  if (planetIndex === 0) {
    return { position: new THREE.Vector3(-4.8, -0.05, BEHIND), scaleMul: SM, opacity: OP };
  }
  return { position: new THREE.Vector3(2.4, 0, BEHIND), scaleMul: SM, opacity: OP };
}

export function getCameraTarget(focus: PlanetFocusIndex | null): THREE.Vector3 {
  if (focus === null) {
    return new THREE.Vector3(0, 0.3, 13.5);
  }
  const cx = focus === 0 ? 2.0 : focus === 1 ? 0 : -2.0;
  /** Um pouco mais afastada quando o planeta é deslocado no enquadramento (lookAt offset). */
  return new THREE.Vector3(cx, 0.44, 26.4);
}
