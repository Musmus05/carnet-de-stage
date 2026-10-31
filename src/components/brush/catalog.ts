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
  paper: string;
};

export const SPECIMEN_VARIANTS = 4;
export const SPECIMEN_STAGES: Stage[] = ["seed", "bud", "flower", "fruit", "wilted", "faded"];

export const SPECIMEN = { width: 360, height: 400, frames: 12, paper: "#f7f8f2" } as const;
/** Specimens shown straight on the page ground (empty states). */
export const SPECIMEN_ON_SHEET = { ...SPECIMEN, paper: "#e9ece2" } as const;

export function specimenSequence(stage: Stage, variant: number, onSheet = false): Sequence {
  const base = onSheet ? SPECIMEN_ON_SHEET : SPECIMEN;
  return { name: `specimen${onSheet ? "-sheet" : ""}-${stage}-${variant}`, ...base };
}

export const LANDING_FOREST: Sequence = { name: "forest-landing", width: 1600, height: 760, frames: 16, paper: "#e9ece2" };
export const LOGIN_FOREST: Sequence = { name: "forest-login", width: 900, height: 820, frames: 16, paper: "#1e3a2b" };

export function framePath(seq: Sequence, index: number) {
  return `/frames/${seq.name}/${String(index).padStart(2, "0")}.webp`;
}
