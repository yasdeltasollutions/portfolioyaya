import * as THREE from 'three';

export type PlanetFocusIndex = 0 | 1 | 2;

/** Raios da esfera base (antes de scaleMul). Maiores que o design inicial (~+55%). */
const SIZE = 1.55;
export const PLANET_RADII = [0.75 * 1.4 * SIZE, 0.75 * 1.6 * SIZE, 0.75 * 2 * SIZE] as const;

/** Mais negativo = mais “atrás” do planeta em foco (z ~ 0.85). */
const BEHIND = -3.35;
const OP = 0.96;
/**
 * Slot **direita** (BG_X_RIGHT) maior que o da **esquerda** — o raio base varia por planeta,
 * por isso o multiplicador da esquerda fica mais baixo para o disco da direita ganhar sempre.
 */
const SM_BG_LEFT = 0.68;
const SM_BG_RIGHT = 1.05;
/** Mesma altura (Y), separados em X — lado a lado. */
const BG_Y = 0.12;
const BG_X_LEFT = -15.4;
const BG_X_RIGHT = -9.85;

/** Vista inicial: escala comum antes dos acréscimos por planeta (esq. +25%, centro +40%, dir. +60%). */
const IDLE_SCALE_BASE = 1.45;
const IDLE_SCALE_BOOST: Record<PlanetFocusIndex, number> = {
  0: 1.25,
  1: 1.4,
  2: 1.6,
};

/** Folga igual entre superfícies vizinhas (unidades de mundo), com o planeta do centro em x = 0. */
const IDLE_SURFACE_GAP = 1.35;

function idlePlanetWorldRadius(planetIndex: PlanetFocusIndex): number {
  return PLANET_RADII[planetIndex] * IDLE_SCALE_BASE * IDLE_SCALE_BOOST[planetIndex];
}

/**
 * Posições em X com centro visual correto: calcula as posições absolutas e depois
 * desloca tudo para que o meio geométrico (entre a borda esquerda do planeta 0 e
 * a borda direita do planeta 2) fique em x = 0.
 */
function idlePlanetX(planetIndex: PlanetFocusIndex): number {
  const r0 = idlePlanetWorldRadius(0);
  const r1 = idlePlanetWorldRadius(1);
  const r2 = idlePlanetWorldRadius(2);
  const G = IDLE_SURFACE_GAP;
  const cx0 = -(r0 + r1 + G);
  const cx1 = 0;
  const cx2 = r1 + r2 + G;
  const leftEdge = cx0 - r0;
  const rightEdge = cx2 + r2;
  const offset = (leftEdge + rightEdge) / 2;
  if (planetIndex === 0) return cx0 - offset;
  if (planetIndex === 1) return cx1 - offset;
  return cx2 - offset;
}

/**
 * Z mínima na vista inicial para a fileira não cortar no frustum (FOV vertical fixo em AboutPlanet).
 * halfWidth ≈ dist * tan(vfov/2) * aspect → dist >= halfSpan / (tan(vfov/2) * aspect)
 */
const IDLE_CAMERA_VFOV = 45;

/** Metade da largura da fileira no plano x (origem ao bordo esq./dir. mais longínquo). */
function idleRowHalfSpanWorld(): number {
  const r0 = idlePlanetWorldRadius(0);
  const r2 = idlePlanetWorldRadius(2);
  const x0 = idlePlanetX(0);
  const x2 = idlePlanetX(2);
  return Math.max(Math.abs(x0 - r0), Math.abs(x2 + r2));
}

/** `aspect` = largura/altura do canvas; ecrãs mais estreitos precisam de Z maior. */
export function getMinIdleCameraZForAspect(aspect: number): number {
  const halfSpan = idleRowHalfSpanWorld();
  const tanHalf = Math.tan(((IDLE_CAMERA_VFOV * Math.PI) / 180) / 2);
  const margin = 1.12;
  const a = Math.max(aspect, 0.48);
  return (halfSpan * margin) / (tanHalf * a);
}

/** Valor inicial do Canvas (desktop ~16:10). */
export const IDLE_CAMERA_Z = getMinIdleCameraZForAspect(1.62);

/**
 * Layout explícito por (foco, índice) — evita planetas fora do frustum ou sobrepostos.
 * Câmara em perspetiva ~ (0, 0.4, 11–14) olhando para a origem.
 */
export function getPlanetLayout(
  focus: PlanetFocusIndex | null,
  planetIndex: PlanetFocusIndex,
): { position: THREE.Vector3; scaleMul: number; opacity: number } {
  if (focus === null) {
    return {
      position: new THREE.Vector3(idlePlanetX(planetIndex), 0, 0),
      scaleMul: IDLE_SCALE_BASE * IDLE_SCALE_BOOST[planetIndex],
      opacity: 1,
    };
  }

  if (focus === planetIndex) {
    /** Posição em mundo; o canto no ecrã é fixado em `AboutPlanet` via alvo NDC (responsivo / zoom). */
    /** +1.005 em X: pedido explícito de deslocar o planeta para a direita. */
    return {
      position: new THREE.Vector3(1.35 + 1.005, 0.1, 0.85),
      // Tamanho original (design) do planeta selecionado.
      scaleMul: 3.68,
      opacity: 1,
    };
  }

  /**
   * Não focados: atrás do principal, fila horizontal (mesmo Y). **Direita** sempre maior que esquerda.
   */
  const zL = BEHIND;
  const zR = BEHIND - 0.12;
  if (focus === 0) {
    if (planetIndex === 1) {
      return {
        position: new THREE.Vector3(BG_X_LEFT, BG_Y, zL),
        scaleMul: SM_BG_LEFT,
        opacity: OP,
      };
    }
    return {
      position: new THREE.Vector3(BG_X_RIGHT, BG_Y, zR),
      scaleMul: SM_BG_RIGHT,
      opacity: OP,
    };
  }
  if (focus === 1) {
    if (planetIndex === 0) {
      return {
        position: new THREE.Vector3(BG_X_LEFT, BG_Y, zL),
        scaleMul: SM_BG_LEFT,
        opacity: OP,
      };
    }
    return {
      position: new THREE.Vector3(BG_X_RIGHT, BG_Y, zR),
      scaleMul: SM_BG_RIGHT,
      opacity: OP,
    };
  }
  /* focus === 2 */
  if (planetIndex === 0) {
    return {
      position: new THREE.Vector3(BG_X_LEFT, BG_Y, zL),
      scaleMul: SM_BG_LEFT,
      opacity: OP,
    };
  }
  return {
    position: new THREE.Vector3(BG_X_RIGHT, BG_Y, zR),
    scaleMul: SM_BG_RIGHT,
    opacity: OP,
  };
}

export function getCameraTarget(focus: PlanetFocusIndex | null): THREE.Vector3 {
  if (focus === null) {
    return new THREE.Vector3(0, 0.3, IDLE_CAMERA_Z);
  }
  const cx = focus === 0 ? 2.0 : focus === 1 ? 0 : -2.0;
  /** Um pouco mais afastada quando o planeta é deslocado no enquadramento (lookAt offset). */
  /** z um pouco maior = mais área útil para encostar o disco ao canto sem o clamp puxar para o centro. */
  /** −1.005 em X: câmara um pouco mais à esquerda → enquadramento mais à direita no ecrã. */
  return new THREE.Vector3(cx - 1.005, 0.42, 27.8);
}
