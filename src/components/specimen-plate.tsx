"use client";

import { useEffect, useRef, useState } from "react";
import type { Status } from "@/lib/domain";

/**
 * A pressed plant drawn with p5.brush (standalone WebGL2 build).
 * The seed makes every application's plant unique; the status sets its
 * growth stage: bud while waiting, flower at interview, fruit for an offer,
 * wilted for a rejection, faded when nobody answered.
 */

type Stage = "seed" | "bud" | "flower" | "fruit" | "wilted" | "faded";

const STAGE: Record<Status, Stage> = {
  to_apply: "seed",
  applied: "bud",
  followed_up: "bud",
  interview: "flower",
  offer: "fruit",
  rejected: "wilted",
  no_answer: "faded",
  withdrawn: "faded",
};

const PALETTE: Record<Stage, { stem: string; leaf: string; head: string; vein: string }> = {
  seed: { stem: "#5d6b43", leaf: "#8a9a62", head: "#a8a77a", vein: "#4a5636" },
  bud: { stem: "#3f5f3a", leaf: "#6f9256", head: "#7f9a5a", vein: "#33502f" },
  flower: { stem: "#3c5e38", leaf: "#5f8a4c", head: "#7d5ba6", vein: "#2f4c2c" },
  fruit: { stem: "#365a34", leaf: "#548548", head: "#b0362c", vein: "#2a4628" },
  wilted: { stem: "#6e5a3a", leaf: "#a08452", head: "#8c4a35", vein: "#5a4a30" },
  faded: { stem: "#8a8470", leaf: "#b5ad94", head: "#a59f8c", vein: "#7d7764" },
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function prng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

function disc(cx: number, cy: number, r: number): Pt[] {
  return Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
}

function leafShape(base: Pt, angle: number, len: number, width: number): Pt[] {
  const pts: Pt[] = [];
  const steps = 9;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const place = (u: number, v: number): Pt => [base[0] + u * cos - v * sin, base[1] + u * sin + v * cos];
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * len;
    pts.push(place(u, Math.sin((i / steps) * Math.PI) * width));
  }
  for (let i = steps - 1; i > 0; i--) {
    const u = (i / steps) * len;
    pts.push(place(u, -Math.sin((i / steps) * Math.PI) * width * 0.85));
  }
  return pts;
}

// p5.brush keeps one active target, so draws run one after another.
let queue: Promise<void> = Promise.resolve();

export function SpecimenPlate({
  seed,
  status,
  width = 280,
  height = 360,
  label,
  className,
  paper = "#f7f8f2",
}: {
  paper?: string;
  seed: string;
  status: Status;
  width?: number;
  height?: number;
  label: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    queue = queue.then(async () => {
      if (cancelled) return;
      try {
        const brush = await import("p5.brush/standalone");
        if (cancelled) return;
        host.replaceChildren();
        const density = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = brush.createCanvas(width, height, { parent: host, pixelDensity: density });
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        drawPlant(brush, seed, STAGE[status], width, height, paper);
        brush.render();
      } catch {
        if (!cancelled) setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [seed, status, width, height, paper]);

  return (
    <figure className={className} role="img" aria-label={label}>
      <div
        ref={hostRef}
        className="w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
        data-failed={failed || undefined}
      />
    </figure>
  );
}

type Brush = typeof import("p5.brush/standalone");

function drawPlant(brush: Brush, seed: string, stage: Stage, w: number, h: number, paper: string) {
  const rand = prng(hash(seed));
  const r = (a: number, b: number) => a + rand() * (b - a);
  const c = PALETTE[stage];

  brush.seed(seed);
  brush.noiseSeed(seed);
  brush.clear(paper);
  brush.scaleBrushes(Math.max(0.8, w / 320));

  // Origin sits at the canvas centre in the standalone build.
  const left = -w / 2;
  const top = -h / 2;
  const baseX = left + w * r(0.42, 0.58);
  const baseY = top + h * 0.9;
  const droop = stage === "wilted";
  const tall = stage === "seed" ? 0.42 : stage === "bud" ? 0.66 : 0.74;

  // Stem as a gently wandering spline.
  const stem: Pt[] = [];
  const segments = 6;
  let x = baseX;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    x += r(-1, 1) * w * 0.035;
    let y = baseY - t * h * tall;
    if (droop && t > 0.7) {
      x += (t - 0.7) * w * 0.9;
      y += (t - 0.7) * h * 0.35;
    }
    stem.push([x, y]);
  }

  // Mounting tape across the base, as on a herbarium sheet.
  brush.noStroke();
  brush.fill("#d9cfb4", 150);
  brush.fillTexture(0.35, 0.2);
  brush.rect(baseX - w * 0.13, baseY - h * 0.1, w * 0.26, h * 0.035);

  // Leaves along the stem, alternating sides.
  const leafCount = stage === "seed" ? 2 : stage === "faded" ? 3 : Math.round(r(4, 6));
  for (let i = 0; i < leafCount; i++) {
    const t = 0.18 + (i / leafCount) * 0.6;
    const idx = Math.min(segments - 1, Math.floor(t * segments));
    const p = stem[idx];
    const side = i % 2 === 0 ? -1 : 1;
    const angle = (side < 0 ? Math.PI : 0) + side * r(-0.75, -0.35);
    const len = w * r(0.2, 0.3) * (1 - t * 0.35);
    const shape = leafShape(p, angle, len, len * r(0.22, 0.3));

    brush.noStroke();
    brush.fill(c.leaf, stage === "faded" ? 70 : 105);
    brush.fillBleed(r(0.08, 0.16), "out");
    brush.fillTexture(0.55, 0.45);
    brush.polygon(shape);

    brush.noFill();
    brush.set("HB", c.vein, 0.8);
    const tip: Pt = [p[0] + Math.cos(angle) * len * 0.9, p[1] + Math.sin(angle) * len * 0.9];
    brush.line(p[0], p[1], tip[0], tip[1]);
  }

  brush.noFill();
  brush.set("2B", c.stem, 2.6);
  brush.spline(stem, 0.55);

  const head = stem[stem.length - 1];
  const headR = w * 0.07;

  if (stage === "seed") {
    brush.noStroke();
    brush.fill(c.head, 120);
    brush.fillTexture(0.4, 0.3);
    brush.polygon(disc(head[0], head[1] - headR * 0.3, headR * 0.45));
    return;
  }

  if (stage === "bud" || stage === "faded") {
    const bud = leafShape([head[0], head[1] + headR * 0.2], -Math.PI / 2 + r(-0.2, 0.2), headR * 2, headR * 0.6);
    brush.noStroke();
    brush.fill(c.head, stage === "faded" ? 70 : 120);
    brush.fillTexture(0.5, 0.4);
    brush.polygon(bud);
    brush.set("HB", c.stem, 0.9);
    brush.noFill();
    brush.polygon(bud);
    return;
  }

  // Flower, fruit and wilted heads share the petals.
  const petals = stage === "wilted" ? 4 : Math.round(r(5, 7));
  const turn = r(0, Math.PI);
  for (let i = 0; i < petals; i++) {
    const a = turn + (i / petals) * Math.PI * 2;
    const len = headR * (stage === "wilted" ? r(1, 1.5) : r(1.7, 2.1));
    const shape = leafShape(head, droop ? a * 0.4 + Math.PI * 0.35 : a, len, len * 0.36);
    brush.noStroke();
    brush.fill(c.head, stage === "fruit" ? 55 : 95);
    brush.fillBleed(0.12, "out");
    brush.fillTexture(0.6, 0.5);
    brush.polygon(shape);
  }

  if (stage === "fruit") {
    const berries = Math.round(r(3, 5));
    for (let i = 0; i < berries; i++) {
      const a = turn + (i / berries) * Math.PI * 2;
      brush.noStroke();
      brush.fill("#b0362c", 150);
      brush.fillTexture(0.35, 0.25);
      brush.polygon(disc(head[0] + Math.cos(a) * headR * 0.9, head[1] + Math.sin(a) * headR * 0.9, headR * 0.42));
    }
  }

  brush.noStroke();
  brush.fill(stage === "wilted" ? "#5e4630" : "#c99a2e", 160);
  brush.polygon(disc(head[0], head[1], headR * 0.38));
}
