import { disc, hash, INK, leaf, prng, stemPath, strokeSteps, wash, type Pt, type Rand, type Stage, type Step } from "./botany";

/**
 * Herbarium specimens with a genome drawn from their seed: habit, leaf shape,
 * leaf arrangement, flower form, colour and fruit. The combinations give
 * thousands of distinct plants; the stage (from the application status)
 * decides how far the plant has grown.
 */

const HABITS = ["single", "branched", "rosette"] as const;
const LEAVES = ["lanceolate", "round", "narrow", "lobed", "compound"] as const;
const ARRANGEMENTS = ["alternate", "opposite", "whorled"] as const;
const HEADS = ["petals", "daisy", "bell", "spike", "cluster", "double"] as const;
const FRUITS = ["berries", "round", "pods"] as const;

/** Petal colours: poppy, cornflower, buttercup, campion, violet, cosmos, saffron, lilac, rose, white. */
const COLOURS = ["#e0533d", "#4f7fd0", "#e8bd3a", "#e48bb4", "#8c5fc4", "#f28c5a", "#d9a21b", "#b493d8", "#c94d6d", "#f1ece0"];
const CENTRES = ["#c99a2e", "#5e4630", "#e8bd3a", "#7a4a2a"];
const FRUIT_COLOURS = ["#b0362c", "#3e3a6e", "#d9822b", "#7a2a3a"];
/** Leaf greens, from sage to deep. */
const GREENS = ["#5f8a4c", "#6f9256", "#4f7d5a", "#7a9a4a", "#5a7f6a"];

export type Genome = {
  habit: (typeof HABITS)[number];
  leaf: (typeof LEAVES)[number];
  arrangement: (typeof ARRANGEMENTS)[number];
  head: (typeof HEADS)[number];
  fruit: (typeof FRUITS)[number];
  colour: string;
  centre: string;
  fruitColour: string;
  green: string;
  nodes: number;
};

export function genome(seed: string): Genome {
  const r = prng(hash(`genome:${seed}`));
  const pick = <T,>(list: readonly T[]) => list[Math.floor(r.next() * list.length)];
  return {
    habit: pick(HABITS),
    leaf: pick(LEAVES),
    arrangement: pick(ARRANGEMENTS),
    head: pick(HEADS),
    fruit: pick(FRUITS),
    colour: pick(COLOURS),
    centre: pick(CENTRES),
    fruitColour: pick(FRUIT_COLOURS),
    green: pick(GREENS),
    nodes: 3 + Math.floor(r.next() * 4),
  };
}

// ---------------------------------------------------------------------------
// Leaf shapes

function leafShape(kind: Genome["leaf"], rand: Rand, base: Pt, angle: number, len: number): Pt[][] {
  switch (kind) {
    case "round":
      return [leaf(base, angle, len * 0.75, len * 0.42)];
    case "narrow":
      return [leaf(base, angle, len * 1.15, len * 0.09)];
    case "lobed": {
      // An oak-like outline: a leaf whose width swells in waves.
      const pts: Pt[] = [];
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const at = (u: number, v: number): Pt => [base[0] + u * cos - v * sin, base[1] + u * sin + v * cos];
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const w = Math.sin(u * Math.PI) * len * 0.3 * (0.65 + 0.35 * Math.abs(Math.sin(u * Math.PI * 3.5)));
        pts.push(at(u * len, w));
      }
      for (let i = n - 1; i > 0; i--) {
        const u = i / n;
        const w = Math.sin(u * Math.PI) * len * 0.28 * (0.65 + 0.35 * Math.abs(Math.sin(u * Math.PI * 3.5 + 0.6)));
        pts.push(at(u * len, -w));
      }
      return [pts];
    }
    case "compound": {
      // Small leaflets in pairs along a rachis.
      const out: Pt[][] = [];
      const pairs = 3 + Math.floor(rand.next() * 2);
      for (let i = 1; i <= pairs; i++) {
        const u = (i / (pairs + 0.6)) * len;
        const p: Pt = [base[0] + Math.cos(angle) * u, base[1] + Math.sin(angle) * u];
        const l = len * 0.32 * (1 - i / (pairs + 2));
        out.push(leaf(p, angle - 0.9, l, l * 0.35), leaf(p, angle + 0.9, l, l * 0.35));
      }
      const tip: Pt = [base[0] + Math.cos(angle) * len, base[1] + Math.sin(angle) * len];
      out.push(leaf(tip, angle, len * 0.28, len * 0.1));
      return out;
    }
    default:
      return [leaf(base, angle, len, len * 0.26)];
  }
}

// ---------------------------------------------------------------------------
// Heads

type HeadCtx = { rand: Rand; at: Pt; r: number; t: number; colour: string; centre: string; fade: number; droop: boolean };

function headSteps(kind: Genome["head"], c: HeadCtx, stem: Pt[]): Step[] {
  const { rand, at, r, t, colour, centre, fade } = c;
  const steps: Step[] = [];
  const turn = rand.range(0, Math.PI);
  const tilt = c.droop ? Math.PI * 0.35 : 0;

  switch (kind) {
    case "daisy": {
      const n = 14 + Math.floor(rand.next() * 8);
      for (let i = 0; i < n; i++) {
        const a = turn + (i / n) * Math.PI * 2 + tilt;
        steps.push(wash(leaf(at, a, r * 1.9, r * 0.22), colour, 110 * fade, t + (i / n) * 0.12, 0.06, 0.5));
      }
      steps.push(wash(disc(at, r * 0.55), centre, 190 * fade, t + 0.14, 0.03, 0.4));
      break;
    }
    case "bell": {
      // A nodding cup: three overlapping petals hanging below the tip.
      const down = Math.PI / 2 + rand.range(-0.25, 0.25);
      for (let i = -1; i <= 1; i++) {
        steps.push(wash(leaf(at, down + i * 0.35, r * 2.2, r * 0.75), colour, 120 * fade, t + (i + 1) * 0.04, 0.08, 0.55));
      }
      break;
    }
    case "spike": {
      // Lavender-like: small florets climbing the top of the stem.
      const top = stem.slice(-3);
      const n = 12 + Math.floor(rand.next() * 8);
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const a = top[0];
        const b = top[top.length - 1];
        const p: Pt = [a[0] + (b[0] - a[0]) * u + rand.range(-1, 1) * r * 0.5, a[1] + (b[1] - a[1]) * u];
        steps.push(wash(disc(p, r * rand.range(0.28, 0.42), 0.2, rand), colour, 150 * fade, t + u * 0.15, 0.05, 0.4));
      }
      break;
    }
    case "cluster": {
      // Small flowers on short rays, like an umbel or a lilac.
      const n = 6 + Math.floor(rand.next() * 5);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 2.2;
        const p: Pt = [at[0] + Math.cos(a) * r * 1.6, at[1] + Math.sin(a) * r * 1.2];
        steps.push(...strokeSteps([at, p], "HB", INK.flower.stem, 0.7, t + i * 0.01, t + i * 0.01 + 0.01));
        steps.push(wash(disc(p, r * 0.45, 0.25, rand), colour, 150 * fade, t + 0.04 + (i / n) * 0.12, 0.05, 0.45));
      }
      break;
    }
    case "double": {
      // Two rings of petals, like a rose or a peony.
      for (const [ring, k] of [[8, 1.6], [6, 1.05]] as const) {
        for (let i = 0; i < ring; i++) {
          const a = turn + (i / ring) * Math.PI * 2 + (k < 1.5 ? 0.3 : 0) + tilt;
          steps.push(wash(leaf(at, a, r * k, r * k * 0.5), colour, (k < 1.5 ? 140 : 100) * fade, t + (k < 1.5 ? 0.08 : 0) + (i / ring) * 0.07, 0.1, 0.6));
        }
      }
      steps.push(wash(disc(at, r * 0.3), centre, 170 * fade, t + 0.16, 0.03, 0.3));
      break;
    }
    default: {
      const n = 5 + Math.floor(rand.next() * 3);
      for (let i = 0; i < n; i++) {
        const a = turn + (i / n) * Math.PI * 2 + tilt;
        steps.push(wash(leaf(at, a, r * rand.range(1.7, 2.1), r * 0.72), colour, 100 * fade, t + (i / n) * 0.12, 0.12, 0.6));
      }
      steps.push(wash(disc(at, r * 0.38), centre, 170 * fade, t + 0.14, 0.02, 0.3));
    }
  }
  return steps;
}

function budSteps(c: HeadCtx, green: string, outline: string): Step[] {
  const bud = leaf([c.at[0], c.at[1] + c.r * 0.2], -Math.PI / 2 + c.rand.range(-0.2, 0.2), c.r * 2, c.r * 0.6);
  return [
    wash(bud, c.colour === "#f1ece0" ? green : c.colour, 90 * c.fade, c.t, 0.06, 0.5),
    {
      t: c.t + 0.05,
      draw: (b, o) => {
        b.noFill();
        b.set("HB", outline, 0.9);
        b.polygon(bud.map(o));
      },
    },
  ];
}

function fruitSteps(kind: Genome["fruit"], c: HeadCtx, colour: string): Step[] {
  const { rand, at, r, t } = c;
  if (kind === "round") return [wash(disc([at[0], at[1] + r * 0.4], r * 0.9, 0.08, rand), colour, 170, t, 0.04, 0.4)];
  if (kind === "pods") {
    return [-0.5, 0, 0.5].map((d, i) => wash(leaf(at, Math.PI / 2 + d, r * 2.4, r * 0.35), "#9a8a3a", 150, t + i * 0.03, 0.04, 0.45));
  }
  const n = 3 + Math.floor(rand.next() * 3);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return wash(disc([at[0] + Math.cos(a) * r * 0.85, at[1] + Math.sin(a) * r * 0.85], r * 0.42), colour, 170, t + i * 0.015, 0.03, 0.35);
  });
}

// ---------------------------------------------------------------------------

/** One specimen, painted bottom to top. `seed` sets the genome and the shape. */
export function specimen(opts: { seed: string; stage: Stage; base: Pt; height: number; tape?: boolean }): Step[] {
  const g = genome(opts.seed);
  const rand = prng(hash(opts.seed));
  const { stage, height: h } = opts;
  const ink = INK[stage];
  const green = stage === "wilted" || stage === "faded" ? ink.leaf : g.green;
  const fade = stage === "faded" ? 0.6 : 1;
  const w = h * 0.75;
  const steps: Step[] = [];

  if (opts.tape) {
    const [bx, by] = opts.base;
    steps.push(wash([[bx - w * 0.14, by - h * 0.05], [bx + w * 0.14, by - h * 0.05], [bx + w * 0.14, by - h * 0.01], [bx - w * 0.14, by - h * 0.01]], "#d9cfb4", 150, 0, 0.02, 0.35));
  }

  const tall = stage === "seed" ? 0.45 : stage === "bud" ? 0.8 : g.habit === "rosette" ? 0.62 : 0.9;
  const stem = stemPath(rand, opts.base, h * tall, w * 0.035, 6);
  if (stage === "wilted") {
    for (let i = 4; i < stem.length; i++) {
      const k = (i - 3) / 3;
      stem[i] = [stem[i][0] + k * w * 0.22, stem[i][1] + k * k * h * 0.1];
    }
  }
  steps.push(...strokeSteps(stem, "2B", ink.stem, 2.2, 0.02, 0.32));

  // Side branches carry extra heads on branched plants.
  const tips: Pt[] = [stem[stem.length - 1]];
  if (g.habit === "branched" && stage !== "seed") {
    for (const side of [-1, 1]) {
      const from = stem[3];
      const len = h * rand.range(0.22, 0.32);
      const to: Pt = [from[0] + side * len * 0.75, from[1] - len * 0.8];
      const mid: Pt = [(from[0] + to[0]) / 2 + side * len * 0.1, (from[1] + to[1]) / 2];
      steps.push(...strokeSteps([from, mid, to], "HB", ink.stem, 1.4, 0.2, 0.32));
      tips.push(to);
    }
  }

  // Leaves: rosette at the base, otherwise along the stem.
  const nodes = stage === "seed" ? 1 : g.nodes;
  const leafLen = w * (g.leaf === "narrow" ? 0.3 : 0.26);
  for (let i = 0; i < nodes; i++) {
    const u = g.habit === "rosette" ? 0.05 + i * 0.04 : 0.15 + (i / Math.max(1, nodes)) * 0.6;
    const p = stem[Math.min(stem.length - 2, Math.floor(u * (stem.length - 1)) + 1)];
    const count = g.arrangement === "whorled" ? 3 : g.arrangement === "opposite" ? 2 : 1;
    for (let k = 0; k < count; k++) {
      const side = count === 1 ? (i % 2 === 0 ? -1 : 1) : k === 0 ? -1 : 1;
      const spread = g.habit === "rosette" ? rand.range(0.1, 0.5) : rand.range(0.35, 0.75);
      const angle = count === 3 && k === 2 ? -Math.PI / 2 + rand.range(-0.3, 0.3) : (side < 0 ? Math.PI : 0) - side * spread;
      const len = leafLen * (g.habit === "rosette" ? 1.25 : 1 - u * 0.4);
      const t = 0.3 + (i / Math.max(1, nodes)) * 0.32 + k * 0.01;
      for (const shape of leafShape(g.leaf, rand, p, angle, len)) {
        steps.push(wash(shape, green, (stage === "faded" ? 70 : 105) * fade, t, 0.1, 0.55));
      }
      if (g.leaf !== "compound" && g.leaf !== "narrow") {
        const tip: Pt = [p[0] + Math.cos(angle) * len * 0.85, p[1] + Math.sin(angle) * len * 0.85];
        steps.push(...strokeSteps([p, tip], "HB", ink.vein, 0.8, t + 0.02, t + 0.03));
      }
    }
  }

  const r = w * 0.07;
  const colour = stage === "wilted" ? ink.head : stage === "faded" ? ink.head : g.colour;

  tips.forEach((tip, i) => {
    const scale = i === 0 ? 1 : 0.7;
    const ctx: HeadCtx = { rand, at: tip, r: r * scale, t: 0.66 + i * 0.04, colour, centre: g.centre, fade, droop: stage === "wilted" };
    if (stage === "seed") {
      if (i === 0) steps.push(wash(disc([tip[0], tip[1] - r * 0.3], r * 0.45), ink.head, 120, 0.85, 0.05, 0.4));
    } else if (stage === "bud" || stage === "faded") {
      steps.push(...budSteps(ctx, green, ink.stem));
    } else {
      // Side branches are too short for a spike: they carry a cluster instead.
      steps.push(...headSteps(i > 0 && g.head === "spike" ? "cluster" : g.head, ctx, stem));
      if (stage === "fruit") steps.push(...fruitSteps(g.fruit, { ...ctx, t: 0.9 }, g.fruitColour));
    }
  });

  return steps;
}
