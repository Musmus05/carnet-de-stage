"use client";

import { useEffect, useRef } from "react";
import { framePath, type Sequence } from "./brush/catalog";

/**
 * Plays a recorded p5.brush painting: one image per moment of the painting,
 * cross-faded on a 2D canvas so the strokes appear smoothly. Works in every
 * browser without WebGL. With reduced motion, shows the finished painting.
 */
export function FramePlayer({
  sequence,
  duration = 2000,
  fit = "contain",
  className = "",
  label,
}: {
  sequence: Sequence;
  duration?: number;
  /** `cover` fills the box and keeps the bottom edge (for forests). */
  fit?: "contain" | "cover";
  className?: string;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let dead = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { frames: count } = sequence;
    const images: HTMLImageElement[] = [];
    const ready: boolean[] = [];

    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => (ready[i] = true);
      img.src = framePath(sequence, i);
      images.push(img);
    }

    const size = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    };

    const draw = (img: HTMLImageElement, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = fit === "cover" ? Math.max(cw / img.naturalWidth, ch / img.naturalHeight) : Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - w) / 2, fit === "cover" ? ch - h : (ch - h) / 2, w, h);
      ctx.globalAlpha = 1;
    };

    let start = -1;
    let shown = -1;
    const tick = (now: number) => {
      if (dead) return;
      // The clock starts once the first frame has arrived, then never waits
      // for more than the next frame.
      if (start < 0 && ready[0]) start = now;
      if (start >= 0) {
        const progress = reduced ? 1 : Math.min(1, (now - start) / duration);
        const pos = progress * (count - 1);
        let i = Math.floor(pos);
        while (i > 0 && !ready[i]) i--;
        const next = Math.min(count - 1, i + 1);
        const blend = ready[next] && next > i ? pos - Math.floor(pos) : 0;
        if (i !== shown || blend > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          draw(images[i], 1);
          if (blend > 0) draw(images[next], blend);
          shown = blend > 0 ? -1 : i;
        }
        if (progress >= 1 && ready[count - 1]) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          draw(images[count - 1], 1);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    size();
    raf = requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => {
      size();
      shown = -1;
      if (!raf || start >= 0) raf = requestAnimationFrame(tick);
    });
    observer.observe(canvas);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [sequence, duration, fit]);

  return (
    <canvas
      ref={canvasRef}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={`block h-full w-full ${className}`}
    />
  );
}
