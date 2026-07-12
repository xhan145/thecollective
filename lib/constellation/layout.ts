// Progress Constellation — deterministic presentation geometry. Pure math,
// no DOM. Positions are design decisions (composed, forward-moving arc), not
// data: evidence stays the source of truth (spec: never store node positions
// as progress). No force layouts, no randomness — the only "random" element
// (ambient evidence dots) is seeded from real evidence ids so the same
// history always draws the same sky.

import type { ConstellationNodeKey } from "./types";

/** Stage coordinate space. All geometry is expressed in 0–100 × 0–106 units
 *  and scaled by the renderer (SVG viewBox + percent-positioned DOM nodes). */
export const STAGE_W = 100;
export const STAGE_H = 106;

export type StagePoint = { x: number; y: number };

/** Hub = the member's active direction; the loop orbits it slightly
 *  off-center so the composition reads intentional, not diagrammatic. */
export const HUB_POS: StagePoint = { x: 44, y: 51 };

/** Loop nodes trace a clockwise arc that suggests forward movement:
 *  lower-left start → upward-left → upper-right → right → lower-right close. */
export const NODE_POS: Record<ConstellationNodeKey, StagePoint> = {
  practice: { x: 21, y: 79 },
  prove: { x: 15, y: 37 },
  feedback: { x: 54, y: 13 },
  apply: { x: 85, y: 41 },
  contribute: { x: 72, y: 82 }
};

/** Radii in stage units (≈ ×3.9 px on a 390 px stage). */
export const HUB_R = 12.5;
export const NODE_R = 8.6;

export const JOURNEY: ConstellationNodeKey[] = ["practice", "prove", "feedback", "apply", "contribute"];

// ---------------------------------------------------------------------------

function dist(a: StagePoint, b: StagePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Point on the segment a→b at `t`, then pushed `offset` along the segment's
 *  left normal — the control point of our quadratic curves. */
function control(a: StagePoint, b: StagePoint, bow: number): StagePoint {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Left normal; positive bow arcs outward on our clockwise journey.
  return { x: mx + (-dy / len) * bow, y: my + (dx / len) * bow };
}

/** Trim the curve so it kisses each node's surface instead of its center
 *  (LumenDeck's orbSurfacePoint detail — endpoints touching rims read as
 *  finished; lines buried under discs read as placeholder). */
function towards(from: StagePoint, to: StagePoint, by: number): StagePoint {
  const d = dist(from, to) || 1;
  return { x: from.x + ((to.x - from.x) / d) * by, y: from.y + ((to.y - from.y) / d) * by };
}

export type ConnectionPath = {
  id: string;
  d: string;
  /** Path length approximation for dash-draw animation. */
  length: number;
};

function quadPath(id: string, a: StagePoint, b: StagePoint, bow: number, trimA: number, trimB: number): ConnectionPath {
  const c = control(a, b, bow);
  const start = towards(a, c, trimA);
  const end = towards(b, c, trimB);
  const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${c.x.toFixed(2)} ${c.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  // Quadratic length ≈ chord/control-polygon blend — plenty for dashoffset.
  const chord = dist(start, end);
  const poly = dist(start, c) + dist(c, end);
  return { id, d, length: (chord + poly) / 2 + 1 };
}

/** The five journey segments, practice→prove→…→contribute, bowed outward. */
export function journeyPaths(): ConnectionPath[] {
  const paths: ConnectionPath[] = [];
  for (let i = 0; i < JOURNEY.length - 1; i++) {
    const fromKey = JOURNEY[i];
    const toKey = JOURNEY[i + 1];
    paths.push(
      quadPath(`journey-${fromKey}-${toKey}`, NODE_POS[fromKey], NODE_POS[toKey], 7.5, NODE_R + 1.2, NODE_R + 1.2)
    );
  }
  return paths;
}

/** Faint hub spokes: direction → each loop node, gently bowed. */
export function spokePaths(): ConnectionPath[] {
  return JOURNEY.map((key, i) =>
    quadPath(`spoke-${key}`, HUB_POS, NODE_POS[key], i % 2 === 0 ? 2.4 : -2.4, HUB_R + 1.2, NODE_R + 1.2)
  );
}

// ---------------------------------------------------------------------------
// Ambient evidence dots — Layer 3 of the atmosphere. One faint point per real
// past action (capped), placed by hashing the evidence id: decorative in
// look, honest in origin. Deterministic: same evidence ⇒ same sky.

export type EvidenceDot = { id: string; x: number; y: number; r: number; opacity: number };

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOT_CAP = 24;

export function evidenceDots(evidenceIds: string[]): EvidenceDot[] {
  const clear = (p: StagePoint) =>
    dist(p, HUB_POS) > HUB_R + 5 && JOURNEY.every((k) => dist(p, NODE_POS[k]) > NODE_R + 5);
  const dots: EvidenceDot[] = [];
  for (const id of evidenceIds.slice(0, DOT_CAP)) {
    const rand = mulberry32(hash32(id));
    // A few placement attempts per dot; skip rather than force-overlap.
    for (let attempt = 0; attempt < 6; attempt++) {
      const p = { x: 6 + rand() * (STAGE_W - 12), y: 5 + rand() * (STAGE_H - 10) };
      if (clear(p)) {
        dots.push({ id, x: p.x, y: p.y, r: 0.55 + rand() * 0.5, opacity: 0.16 + rand() * 0.18 });
        break;
      }
    }
  }
  return dots;
}
