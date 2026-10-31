import type { Status } from "@/lib/domain";

/**
 * Plant drawings for p5.brush, expressed as timed steps so a scene can be
 * painted stroke by stroke. Coordinates are canvas pixels from the top-left;
 * the painter converts them to the brush's centred origin.
 */

export type Brush = typeof import("p5.brush/standalone");
export type Pt = [number, number];
/** One paint operation; `t` in [0, 1] is when it appears within its plant. */
export type Step = { t: number; draw: (b: Brush, o: Origin) => void };
export type Origin = (p: Pt) => Pt;

export type Stage = "seed" | "bud" | "flower" | "fruit" | "wilted" | "faded";

export const STAGE: Record<Status, Stage> = {
  to_apply: "seed",
  applied: "bud",
  followed_up: "bud",
  interview: "flower",
  offer: "fruit",
  rejected: "wilted",
  no_answer: "faded",
  withdrawn: "faded",
};

type Ink = { stem: string; leaf: string; head: string; vein: string };

export const INK: Record<Stage, Ink> = {
  seed: { stem: "#5d6b43", leaf: "#8a9a62", head: "#a8a77a", vein: "#4a5636" },
  bud: { stem: "#3f5f3a", leaf: "#6f9256", head: "#7f9a5a", vein: "#33502f" },
  flower: { stem: "#3c5e38", leaf: "#5f8a4c", head: "#7d5ba6", vein: "#2f4c2c" },
  fruit: { stem: "#365a34", leaf: "#548548", head: "#e0806a", vein: "#2a4628" },
  wilted: { stem: "#6e5a3a", leaf: "#a08452", head: "#8c4a35", vein: "#5a4a30" },
  faded: { stem: "#8a8470", leaf: "#b5ad94", head: "#a59f8c", vein: "#7d7764" },
};

// ---------------------------------------------------------------------------
// Random and geometry helpers

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function prng(seed: number) {
  let a = seed || 1;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, range: (lo: number, hi: number) => lo + next() * (hi - lo) };
}

type Rand = ReturnType<typeof prng>;

function leaf(base: Pt, angle: number, len: number, width: number): Pt[] {
  const pts: Pt[] = [];
  const steps = 9;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const at = (u: number, v: number): Pt => [base[0] + u * cos - v * sin, base[1] + u * sin + v * cos];
  for (let i = 0; i <= steps; i++) pts.push(at((i / steps) * len, Math.sin((i / steps) * Math.PI) * width));
  for (let i = steps - 1; i > 0; i--) pts.push(at((i / steps) * len, -Math.sin((i / steps) * Math.PI) * width * 0.85));
  return pts;
}

function disc(c: Pt, r: number, wobble = 0, rand?: Rand): Pt[] {
  return Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const k = 1 + (rand ? rand.range(-wobble, wobble) : 0);
    return [c[0] + Math.cos(a) * r * k, c[1] + Math.sin(a) * r * k] as Pt;
  });
}

/** A wandering stem from `base` rising `height`, as a list of points. */
function stemPath(rand: Rand, base: Pt, height: number, sway: number, segments = 5): Pt[] {
  const pts: Pt[] = [base];
  let x = base[0];
  for (let i = 1; i <= segments; i++) {
    x += rand.range(-1, 1) * sway;
    pts.push([x, base[1] - (i / segments) * height]);
  }
  return pts;
}

/** Paints a path segment by segment between t0 and t1. */
function strokeSteps(path: Pt[], brushName: string, color: string, weight: number, t0: number, t1: number): Step[] {
  return path.slice(1).map((p, i) => ({
    t: t0 + ((i + 1) / (path.length - 1)) * (t1 - t0),
    draw: (b, o) => {
      const a = o(path[i]);
      const c = o(p);
      b.noFill();
      b.set(brushName, color, weight);
      b.line(a[0], a[1], c[0], c[1]);
    },
  }));
}

function wash(shape: Pt[], color: string, opacity: number, t: number, bleed = 0.12, texture = 0.55): Step {
  return {
    t,
    draw: (b, o) => {
      b.noStroke();
      b.fill(color, opacity);
      b.fillBleed(bleed, "out");
      b.fillTexture(texture, 0.45);
      b.polygon(shape.map(o));
    },
  };
}

// ---------------------------------------------------------------------------
// Species

export type PlantOptions = {
  seed: string;
  base: Pt;
  height: number;
  ink?: Partial<Ink>;
  /** Opacity multiplier, for distant plants. */
  fade?: number;
  /** Brush weight multiplier. */
  weight?: number;
};

/** The specimen flower whose growth stage follows an application status. */
export function flower(opts: PlantOptions & { stage: Stage; tape?: boolean }): Step[] {
  const rand = prng(hash(opts.seed));
  const ink = { ...INK[opts.stage], ...opts.ink };
  const fade = opts.fade ?? 1;
  const wgt = opts.weight ?? 1;
  const { stage, height: h } = opts;
  const w = h * 0.75;
  const steps: Step[] = [];
  const tall = stage === "seed" ? 0.5 : stage === "bud" ? 0.82 : 0.92;
  const stem = stemPath(rand, opts.base, h * tall, w * 0.035);

  if (stage === "wilted") {
    for (let i = 5; i < stem.length; i++) {
      const k = (i - 4) / 3;
      stem[i] = [stem[i][0] + k * w * 0.25, stem[i][1] + k * k * h * 0.12];
    }
  }

  if (opts.tape) {
    const [bx, by] = opts.base;
    steps.push(wash([[bx - w * 0.14, by - h * 0.05], [bx + w * 0.14, by - h * 0.05], [bx + w * 0.14, by - h * 0.01], [bx - w * 0.14, by - h * 0.01]], "#d9cfb4", 150, 0, 0.02, 0.35));
  }

  steps.push(...strokeSteps(stem, "2B", ink.stem, 2.4 * wgt, 0.02, 0.35));

  const leaves = stage === "seed" ? 2 : stage === "faded" ? 3 : Math.round(rand.range(4, 6));
  for (let i = 0; i < leaves; i++) {
    const at = 0.18 + (i / leaves) * 0.6;
    const p = stem[Math.min(stem.length - 2, Math.floor(at * (stem.length - 1)) + 1)];
    const side = i % 2 === 0 ? -1 : 1;
    const angle = (side < 0 ? Math.PI : 0) + side * rand.range(-0.75, -0.35);
    const len = w * rand.range(0.2, 0.3) * (1 - at * 0.35);
    const t = 0.3 + (i / leaves) * 0.35;
    steps.push(wash(leaf(p, angle, len, len * rand.range(0.22, 0.3)), ink.leaf, (stage === "faded" ? 70 : 105) * fade, t));
    const tip: Pt = [p[0] + Math.cos(angle) * len * 0.9, p[1] + Math.sin(angle) * len * 0.9];
    steps.push(...strokeSteps([p, tip], "HB", ink.vein, 0.8 * wgt, t + 0.02, t + 0.04));
  }

  const head = stem[stem.length - 1];
  const r = w * 0.07;

  if (stage === "seed") {
    steps.push(wash(disc([head[0], head[1] - r * 0.3], r * 0.45), ink.head, 120 * fade, 0.85, 0.05, 0.4));
    return steps;
  }

  if (stage === "bud" || stage === "faded") {
    const bud = leaf([head[0], head[1] + r * 0.2], -Math.PI / 2 + rand.range(-0.2, 0.2), r * 2, r * 0.6);
    steps.push(wash(bud, ink.head, (stage === "faded" ? 70 : 120) * fade, 0.8, 0.06, 0.5));
    steps.push({
      t: 0.9,
      draw: (b, o) => {
        b.noFill();
        b.set("HB", ink.stem, 0.9 * wgt);
        b.polygon(bud.map(o));
      },
    });
    return steps;
  }

  const petals = stage === "wilted" ? 4 : Math.round(rand.range(5, 7));
  const turn = rand.range(0, Math.PI);
  for (let i = 0; i < petals; i++) {
    const a = turn + (i / petals) * Math.PI * 2;
    const len = r * (stage === "wilted" ? rand.range(1, 1.5) : rand.range(1.7, 2.1));
    const dir = stage === "wilted" ? a * 0.4 + Math.PI * 0.35 : a;
    steps.push(wash(leaf(head, dir, len, len * 0.36), ink.head, (stage === "fruit" ? 70 : 95) * fade, 0.68 + (i / petals) * 0.18, 0.12, 0.6));
  }

  if (stage === "fruit") {
    const berries = Math.round(rand.range(3, 5));
    for (let i = 0; i < berries; i++) {
      const a = turn + (i / berries) * Math.PI * 2;
      steps.push(wash(disc([head[0] + Math.cos(a) * r * 0.9, head[1] + Math.sin(a) * r * 0.9], r * 0.42), "#b0362c", 160 * fade, 0.9 + i * 0.015, 0.03, 0.35));
    }
  }

  steps.push(wash(disc(head, r * 0.38), stage === "wilted" ? "#5e4630" : "#c99a2e", 170 * fade, 0.97, 0.02, 0.3));
  return steps;
}

/** A fern frond: arching rachis with paired pinnae. */
export function fern(opts: PlantOptions): Step[] {
  const rand = prng(hash(opts.seed));
  const ink = { stem: "#3e5c37", leaf: "#5d8a4a", ...opts.ink };
  const fade = opts.fade ?? 1;
  const h = opts.height;
  const lean = rand.range(-0.35, 0.35);
  const n = 9;
  const path: Pt[] = Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return [opts.base[0] + Math.sin(u * 1.4) * lean * h * 0.6, opts.base[1] - u * h * (1 - u * 0.12)];
  });
  const steps = strokeSteps(path, "HB", ink.stem!, 1.4 * (opts.weight ?? 1), 0, 0.35);
  const pairs = Math.round(rand.range(7, 10));
  for (let i = 1; i <= pairs; i++) {
    const u = i / (pairs + 1);
    const idx = Math.min(n, Math.round(u * n));
    const p = path[idx];
    const len = h * 0.2 * (1 - u * 0.75);
    const tangent = Math.atan2(path[Math.min(n, idx + 1)][1] - p[1], path[Math.min(n, idx + 1)][0] - p[0]);
    for (const side of [-1, 1]) {
      steps.push(wash(leaf(p, tangent + side * 1.15, len, len * 0.22), ink.leaf!, 90 * fade, 0.35 + u * 0.6, 0.08, 0.5));
    }
  }
  return steps;
}

/** A tuft of grass blades. */
export function grass(opts: PlantOptions): Step[] {
  const rand = prng(hash(opts.seed));
  const color = opts.ink?.stem ?? "#557a3f";
  const blades = Math.round(rand.range(5, 9));
  const steps: Step[] = [];
  for (let i = 0; i < blades; i++) {
    const lean = rand.range(-0.5, 0.5);
    const h = opts.height * rand.range(0.55, 1);
    const x0 = opts.base[0] + rand.range(-0.08, 0.08) * opts.height;
    const path: Pt[] = Array.from({ length: 5 }, (_, k) => {
      const u = k / 4;
      return [x0 + lean * u * u * h * 0.6, opts.base[1] - u * h];
    });
    const brushName = rand.next() > 0.5 ? "2B" : "HB";
    steps.push({
      t: (i / blades) * 0.9,
      draw: (b, o) => {
        b.noFill();
        b.set(brushName, color, 1.2 * (opts.weight ?? 1));
        b.spline(path.map(o), 0.5);
      },
    });
  }
  return steps;
}

/** A tree: trunk, a few branches and a watercolour canopy. */
export function tree(opts: PlantOptions): Step[] {
  const rand = prng(hash(opts.seed));
  const ink = { stem: "#4b4231", leaf: "#4f7d48", ...opts.ink };
  const fade = opts.fade ?? 1;
  const h = opts.height;
  const trunk = stemPath(rand, opts.base, h * 0.62, h * 0.02, 6);
  const steps = strokeSteps(trunk, "HB", ink.stem!, 2.2 * (opts.weight ?? 1), 0, 0.3);
  const top = trunk[trunk.length - 1];
  for (let i = 0; i < 4; i++) {
    const from = trunk[2 + (i % 4)] ?? top;
    const side = i % 2 ? 1 : -1;
    const to: Pt = [from[0] + side * h * rand.range(0.12, 0.22), from[1] - h * rand.range(0.1, 0.2)];
    steps.push(...strokeSteps([from, to], "HB", ink.stem!, 1.1 * (opts.weight ?? 1), 0.2 + i * 0.04, 0.3 + i * 0.04));
  }
  const blobs = Math.round(rand.range(5, 8));
  for (let i = 0; i < blobs; i++) {
    const c: Pt = [top[0] + rand.range(-0.24, 0.24) * h, top[1] + rand.range(-0.2, 0.12) * h];
    steps.push(wash(disc(c, h * rand.range(0.11, 0.19), 0.12, rand), ink.leaf!, 55 * fade, 0.4 + (i / blobs) * 0.55, 0.18, 0.7));
  }
  return steps;
}

/** An umbel (wild carrot): rays ending in clusters of small dots. */
export function umbel(opts: PlantOptions): Step[] {
  const rand = prng(hash(opts.seed));
  const ink = { stem: "#4c6a3e", head: "#efe9d6", ...opts.ink };
  const fade = opts.fade ?? 1;
  const h = opts.height;
  const stem = stemPath(rand, opts.base, h, h * 0.02, 6);
  const steps = strokeSteps(stem, "HB", ink.stem!, 1.4 * (opts.weight ?? 1), 0, 0.45);
  const top = stem[stem.length - 1];
  const rays = Math.round(rand.range(6, 9));
  for (let i = 0; i < rays; i++) {
    const a = -Math.PI / 2 + ((i / (rays - 1)) - 0.5) * 1.9;
    const end: Pt = [top[0] + Math.cos(a) * h * 0.14, top[1] + Math.sin(a) * h * 0.1];
    steps.push(...strokeSteps([top, end], "HB", ink.stem!, 0.8, 0.45 + i * 0.02, 0.5 + i * 0.02));
    steps.push(wash(disc(end, h * 0.022, 0.2, rand), ink.head!, 170 * fade, 0.6 + (i / rays) * 0.35, 0.04, 0.4));
  }
  return steps;
}
