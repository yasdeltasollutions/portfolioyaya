import * as THREE from 'three';

export type PlanetFocusIndex = 0 | 1 | 2;

/** Raios da esfera base (antes de scaleMul). */
export const PLANET_RADII = [0.75 * 1.4, 0.75 * 1.6, 0.75 * 2] as const;

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
    const x = (planetIndex - 1) * 4.2;
    return {
      position: new THREE.Vector3(x, 0, 0),
      scaleMul: 1,
      opacity: 1,
    };
  }

  if (focus === planetIndex) {
    /** +50% face ao valor anterior (1.52 × 1.5); câmara/FOV compensam o recorte. */
    return {
      position: new THREE.Vector3(2.55, 0.12, 0.85),
      scaleMul: 2.28,
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
  /** Mais afastada para o planeta ~50% maior caber no frustum. */
  return new THREE.Vector3(cx, 0.42, 15.1);
}
