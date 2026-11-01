"use client";

import { LANDING_FOREST, LOGIN_FOREST, RAIL_FOREST } from "./brush/catalog";
import { forestScene, railScene } from "./brush/scenes";
import { FramePlayer } from "./frame-player";
import { LivePainting, useLivePainting } from "./live-painting";

const FADE = "linear-gradient(to bottom, transparent 0%, #000 22%)";

const SCENES = {
  landing: { sequence: LANDING_FOREST, build: (w: number, h: number) => forestScene("landing-forest", w, h, "sheet", { from: 0, to: 0.52 }) },
  login: { sequence: LOGIN_FOREST, build: (w: number, h: number) => forestScene("login-forest", w, h, "fern") },
  rail: { sequence: RAIL_FOREST, build: (w: number, h: number) => railScene("rail", w, h) },
};

/**
 * A forest rising from the bottom edge. Painted live with p5.brush where the
 * brush starts fast, sized to the container; elsewhere (Firefox) the recorded
 * frames are played and scaled to cover. Decorative.
 */
export function Forest({
  scene,
  duration = 3500,
  className = "",
}: {
  scene: keyof typeof SCENES;
  duration?: number;
  className?: string;
}) {
  const live = useLivePainting();
  const s = SCENES[scene];
  const frames = <FramePlayer sequence={s.sequence} duration={duration} fit="cover" />;

  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      // Fade the top edge so no canopy ends on a straight line.
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      {live === null ? null : live ? (
        <LivePainting
          seed={s.sequence.name}
          paper={s.sequence.paper}
          build={s.build}
          duration={duration}
          fallback={frames}
        />
      ) : (
        frames
      )}
    </div>
  );
}
