"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Step } from "./brush/botany";
import { canPaintLive, paint } from "./brush/painter";

const noSubscribe = () => () => {};

/**
 * true where p5.brush paints live, false where recorded frames are played,
 * null during server rendering and hydration.
 */
export function useLivePainting() {
  return useSyncExternalStore(noSubscribe, canPaintLive, () => null);
}

/**
 * Paints `build(width, height)` live with p5.brush, stroke by stroke, sized
 * to its container. Shows `fallback` (the recorded frames) if the brush fails.
 */
export function LivePainting({
  seed,
  build,
  paper,
  duration,
  fallback,
  className = "",
}: {
  seed: string;
  build: (width: number, height: number) => Step[];
  paper?: string;
  duration: number;
  fallback: ReactNode;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const buildRef = useRef(build);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    buildRef.current = build;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host || failed) return;
    let cancel: (() => void) | undefined;
    let dead = false;
    let lastWidth = 0;

    const draw = (animate: boolean) => {
      const { width, height } = host.getBoundingClientRect();
      if (width < 10 || height < 10) return;
      lastWidth = width;
      cancel?.();
      const w = Math.round(width);
      const h = Math.round(height);
      paint({ host, width: w, height: h, paper, seed, steps: buildRef.current(w, h), duration: animate ? duration : 0 })
        .then((c) => (dead ? c() : (cancel = c)))
        .catch(() => !dead && setFailed(true));
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
  }, [seed, paper, duration, failed]);

  if (failed) return <>{fallback}</>;
  return <div ref={hostRef} aria-hidden className={`h-full w-full ${className}`} style={paper ? { background: paper } : undefined} />;
}
