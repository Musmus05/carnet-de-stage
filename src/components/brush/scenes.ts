import { fern, flower, grass, hash, prng, tree, umbel, type Stage, type Step } from "./botany";

/** Shifts a plant's own 0..1 timeline into a window of the scene's timeline. */
function within(steps: Step[], start: number, span: number): Step[] {
  return steps.map((s) => ({ ...s, t: start + s.t * span }));
}

/** One pressed plant on its sheet, centred, with mounting tape. */
export function specimenScene(seed: string, stage: Stage, width: number, height: number): Step[] {
  const h = Math.min(height * 0.88, width * 1.25);
  return flower({ seed, stage, base: [width * 0.5, height * 0.92], height: h, tape: true });
}

export type ForestTone = "sheet" | "fern";

type Tone = {
  tree: string;
  trunk: string;
  fern: string;
  grass: string;
  umbel: string;
  /** Leaf and stem ink for flowers; the botany default when absent. */
  leaf?: string;
  stem?: string;
  fade: number;
  /** Pixels of width per tree, per plant and per grass tuft. */
  density: { tree: number; plant: number; tuft: number };
  treeHeight: [number, number];
  plantHeight: [number, number];
  /** Share of plants that are flowers (the rest are ferns and umbels). */
  flowers: number;
  /** Light paint under petals so colours stay bright on a dark ground. */
  underpaint?: string;
};

const TONES: Record<ForestTone, Tone> = {
  // Landing: a woodland edge in soft greens, a few flowers.
  sheet: {
    tree: "#58875a", trunk: "#7a6b52", fern: "#5d8a4a", grass: "#5e7f45", umbel: "#f3eedc", fade: 0.85,
    density: { tree: 170, plant: 110, tuft: 80 }, treeHeight: [0.45, 0.68], plantHeight: [0.2, 0.38], flowers: 0.45,
  },
  // Sign-in rail: a flowering meadow on dark green, with only a few trees.
  fern: {
    tree: "#6f9a66", trunk: "#a9b79c", fern: "#8fb47c", grass: "#9cbd88", umbel: "#f4efdd", leaf: "#8fbf7a", stem: "#a8c99a", fade: 1.6, underpaint: "#f4efdd",
    density: { tree: 380, plant: 42, tuft: 60 }, treeHeight: [0.38, 0.55], plantHeight: [0.18, 0.5], flowers: 0.7,
  },
};

const STAGES: Stage[] = ["flower", "fruit", "bud", "flower", "fruit"];

/** Wildflower heads: poppy, cornflower, buttercup, campion, violet, cosmos. */
const WILD = ["#e0533d", "#4f7fd0", "#e8bd3a", "#e48bb4", "#9a6bd0", "#f28c5a"];

/**
 * A forest rising from the bottom edge: trees behind, ferns, umbels and
 * flowers in the middle, grass in front. `quiet` keeps a zone low so text
 * placed over it stays readable.
 */
export function forestScene(
  seed: string,
  width: number,
  height: number,
  tone: ForestTone,
  quiet?: { from: number; to: number },
): Step[] {
  const rand = prng(hash(seed));
  const c = TONES[tone];
  const ground = height;
  const steps: Step[] = [];
  const isQuiet = (x: number) => quiet && x > quiet.from * width && x < quiet.to * width;
  const spread = (n: number, i: number) => ((i + rand.range(0.15, 0.85)) / n) * width;

  const trees = Math.max(2, Math.round(width / c.density.tree));
  for (let i = 0; i < trees; i++) {
    const x = spread(trees, i);
    const h = height * (isQuiet(x) ? rand.range(0.14, 0.2) : rand.range(...c.treeHeight));
    steps.push(...within(tree({ seed: `${seed}-t${i}`, base: [x, ground + 4], height: h, ink: { leaf: c.tree, stem: c.trunk }, fade: 0.75 * c.fade }), rand.range(0, 0.25), 0.55));
  }

  const plants = Math.max(5, Math.round(width / c.density.plant));
  for (let i = 0; i < plants; i++) {
    const x = spread(plants, i);
    const h = height * (isQuiet(x) ? rand.range(0.07, 0.12) : rand.range(...c.plantHeight));
    const kind = rand.next();
    const opts = { seed: `${seed}-p${i}`, base: [x, ground + 2] as [number, number], height: h, fade: c.fade };
    const head = WILD[Math.floor(rand.next() * WILD.length)];
    const plant =
      kind < c.flowers
        ? flower({ ...opts, stage: STAGES[i % STAGES.length], underpaint: c.underpaint, ink: { head, ...(c.leaf && { leaf: c.leaf }), ...(c.stem && { stem: c.stem }) } })
        : kind < c.flowers + (1 - c.flowers) / 2
          ? fern({ ...opts, ink: { stem: c.trunk, leaf: c.fern } })
          : umbel({ ...opts, ink: { stem: c.grass, head: c.umbel } });
    steps.push(...within(plant, 0.2 + rand.range(0, 0.3), 0.45));
  }

  const tufts = Math.max(6, Math.round(width / c.density.tuft));
  for (let i = 0; i < tufts; i++) {
    const x = spread(tufts, i);
    steps.push(...within(grass({ seed: `${seed}-g${i}`, base: [x, ground + 2], height: height * rand.range(0.05, 0.11), ink: { stem: c.grass } }), 0.45 + rand.range(0, 0.25), 0.3));
  }

  return steps;
}
