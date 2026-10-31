"use client";

import { useEffect, useRef } from "react";
import type { Status } from "@/lib/domain";
import { STAGE } from "./brush/botany";
import { paint } from "./brush/painter";
import { specimenScene } from "./brush/scenes";

/**
 * A pressed plant painted stroke by stroke with p5.brush. The seed makes
 * every application's plant unique; the status sets its growth stage:
 * bud while waiting, flower at interview, fruit for an offer, wilted for a
 * rejection, faded when nobody answered.
 */
export function SpecimenPlate({
  seed,
  status,
  width = 280,
  height = 360,
  label,
  className,
  paper = "#f7f8f2",
  duration = 2000,
}: {
  seed: string;
  status: Status;
  width?: number;
  height?: number;
  label: string;
  className?: string;
  paper?: string;
  duration?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancel: (() => void) | undefined;
    let dead = false;
    paint({
      host,
      width,
      height,
      paper,
      seed,
      steps: specimenScene(seed, STAGE[status], width, height),
      duration,
    })
      .then((c) => (dead ? c() : (cancel = c)))
      .catch(() => {});
    return () => {
      dead = true;
      cancel?.();
    };
  }, [seed, status, width, height, paper, duration]);

  return (
    <figure className={className} role="img" aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      <div ref={hostRef} className="w-full" style={{ aspectRatio: `${width} / ${height}`, background: paper }} />
    </figure>
  );
}
