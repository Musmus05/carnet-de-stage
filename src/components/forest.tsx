"use client";

import { useEffect, useRef } from "react";
import { paint } from "./brush/painter";
import { forestScene, type ForestTone } from "./brush/scenes";

/**
 * A forest that paints itself upward from the bottom edge, sized to its
 * container. Decorative: hidden from assistive technology.
 */
export function Forest({
  seed,
  tone,
  paper,
  quiet,
  duration = 4000,
  className = "",
}: {
  seed: string;
  tone: ForestTone;
  paper: string;
  quiet?: { from: number; to: number };
  duration?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quietKey = quiet ? `${quiet.from}-${quiet.to}` : "";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancel: (() => void) | undefined;
    let dead = false;
    let lastWidth = 0;

    const draw = (animate: boolean) => {
      const { width, height } = host.getBoundingClientRect();
      if (width < 10 || height < 10) return;
      lastWidth = width;
      cancel?.();
      const range = quietKey ? quietKey.split("-").map(Number) : null;
      paint({
        host,
        width: Math.round(width),
        height: Math.round(height),
        paper,
        seed,
        steps: forestScene(seed, width, height, tone, range ? { from: range[0], to: range[1] } : undefined),
        duration: animate ? duration : 0,
      })
        .then((c) => (dead ? c() : (cancel = c)))
        .catch(() => {});
    };

    draw(true);

    // Repaint without animation when the width really changes.
    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(host.getBoundingClientRect().width - lastWidth) > 40) draw(false);
      }, 250);
    });
    observer.observe(host);

    return () => {
      dead = true;
      observer.disconnect();
      window.clearTimeout(timer);
      cancel?.();
    };
  }, [seed, tone, paper, quietKey, duration]);

  return <div ref={hostRef} aria-hidden className={`pointer-events-none ${className}`} style={{ background: paper }} />;
}
