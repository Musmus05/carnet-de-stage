"use client";

import { useMemo } from "react";
import type { Status } from "@/lib/domain";
import { hash, STAGE } from "./brush/botany";
import { SPECIMEN, SPECIMEN_VARIANTS, specimenSequence } from "./brush/catalog";
import { FramePlayer } from "./frame-player";

/**
 * A pressed plant painted with p5.brush, played back stroke by stroke from
 * recorded frames. The seed picks one of the recorded variants; the status
 * sets its growth stage: bud while waiting, flower at interview, fruit for an
 * offer, wilted for a rejection, faded when nobody answered.
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
  const sequence = useMemo(
    () => specimenSequence(STAGE[status], hash(seed) % SPECIMEN_VARIANTS),
    [seed, status],
  );

  return (
    <figure className={className}>
      <div className="w-full" style={{ aspectRatio: `${SPECIMEN.width} / ${SPECIMEN.height}` }}>
        <FramePlayer sequence={sequence} duration={duration} label={label} />
      </div>
    </figure>
  );
}
