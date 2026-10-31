import type { Stage } from "./botany";

/**
 * Recorded painting sequences served from /public/frames. Regenerate them
 * with the development page /dev/frames after changing the botany.
 */

export type Sequence = {
  name: string;
  width: number;
  height: number;
  frames: number;
  /** Ground colour painted under the plants; transparent when absent. */
  paper?: string;
};

export const SPECIMEN_VARIANTS = 4;
export const SPECIMEN_STAGES: Stage[] = ["seed", "bud", "flower", "fruit", "wilted", "faded"];

/** Frames are painted on a transparent ground, so they sit on any surface. */
export const SPECIMEN = { width: 360, height: 400, frames: 12 } as const;

export function specimenSequence(stage: Stage, variant: number): Sequence {
  return { name: `specimen-${stage}-${variant}`, ...SPECIMEN };
}

export const LANDING_FOREST: Sequence = { name: "forest-landing", width: 1600, height: 760, frames: 16 };
// Watercolour on a transparent ground turns pale over dark green, so the
// login forest is painted on the rail colour; its top edge is faded out.
export const LOGIN_FOREST: Sequence = { name: "forest-login", width: 900, height: 820, frames: 16, paper: "#1e3a2b" };

export function framePath(seq: Sequence, index: number) {
  return `/frames/${seq.name}/${String(index).padStart(2, "0")}.webp`;
}
