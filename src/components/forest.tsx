"use client";

import { LANDING_FOREST, LOGIN_FOREST } from "./brush/catalog";
import { FramePlayer } from "./frame-player";

const FADE = "linear-gradient(to bottom, transparent 0%, #000 22%)";

/**
 * A forest painted with p5.brush rising from the bottom edge, played back
 * from recorded frames and scaled to cover its container. Decorative.
 */
export function Forest({
  scene,
  duration = 3500,
  className = "",
}: {
  scene: "landing" | "login";
  duration?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      // Fade the top edge so no canopy ends on a straight line.
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <FramePlayer sequence={scene === "landing" ? LANDING_FOREST : LOGIN_FOREST} duration={duration} fit="cover" />
    </div>
  );
}
