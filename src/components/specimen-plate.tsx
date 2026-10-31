"use client";

import { useMemo } from "react";
import type { Status } from "@/lib/domain";
import { hash, STAGE } from "./brush/botany";
import { SPECIMEN, SPECIMEN_VARIANTS, specimenSequence } from "./brush/catalog";
import { specimenScene } from "./brush/scenes";
import { FramePlayer } from "./frame-player";
import { LivePainting, useLivePainting } from "./live-painting";

/**
 * A pressed plant painted with p5.brush. Where the brush starts fast it is
 * painted live, stroke by stroke, and the seed makes every application's
 * plant unique; elsewhere (Firefox) a recorded variant is played back.
 * The status sets its growth stage: bud while waiting, flower at interview,
 * fruit for an offer, wilted for a rejection, faded when nobody answered.
 */
export function SpecimenPlate({
  seed,
  status,
  label,
  className,
  duration = 2000,
}: {
  seed: string;
  status: Status;
  label: string;
  className?: string;
  duration?: number;
}) {
  const live = useLivePainting();
  const stage = STAGE[status];
  const sequence = useMemo(() => specimenSequence(stage, hash(seed) % SPECIMEN_VARIANTS), [seed, stage]);
  const frames = <FramePlayer sequence={sequence} duration={duration} label={label} />;

  return (
    <figure className={className} role={live ? "img" : undefined} aria-label={live && label ? label : undefined}>
      <div className="w-full" style={{ aspectRatio: `${SPECIMEN.width} / ${SPECIMEN.height}` }}>
        {live === null ? null : live ? (
          <LivePainting
            seed={`${seed}-${stage}`}
            build={(w, h) => specimenScene(seed, stage, w, h)}
            duration={duration}
            fallback={frames}
          />
        ) : (
          frames
        )}
      </div>
    </figure>
  );
}
