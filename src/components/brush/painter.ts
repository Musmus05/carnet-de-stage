import type { Brush, Origin, Pt, Step } from "./botany";

/**
 * Plays timed brush steps on WebGL2 canvases, frame by frame.
 * p5.brush keeps one active target, so a single requestAnimationFrame loop
 * switches between canvases with brush.load() and paints each one's due steps.
 */

// Start downloading the brush as soon as this module runs in the browser.
let brushPromise: Promise<Brush> | null = null;
export function loadBrush() {
  brushPromise ??= import("p5.brush/standalone");
  return brushPromise;
}
if (typeof window !== "undefined") void loadBrush();

type Job = {
  canvas: HTMLCanvasElement;
  steps: Step[];
  origin: Origin;
  start: number;
  duration: number;
  next: number;
  scale: number;
  onDone?: () => void;
};

const jobs = new Set<Job>();
let frame = 0;

// brush.scaleBrushes() multiplies the current sizes, so track what is applied.
let appliedScale = 1;
function setScale(brush: Brush, scale: number) {
  if (scale === appliedScale) return;
  brush.scaleBrushes(scale / appliedScale);
  appliedScale = scale;
}

let activeCanvas: HTMLCanvasElement | null = null;

// Milliseconds of painting allowed per frame, shared by all canvases.
const FRAME_BUDGET = 12;

function tick(brush: Brush, now: number) {
  const deadline = performance.now() + FRAME_BUDGET;
  // Small scenes (a single specimen) first, so they finish on time.
  const ordered = [...jobs].sort((a, b) => a.steps.length - b.steps.length);
  for (const job of ordered) {
    if (!job.canvas.isConnected) {
      jobs.delete(job);
      continue;
    }
    const elapsed = job.duration <= 0 ? 1 : (now - job.start) / job.duration;
    if (job.next >= job.steps.length || job.steps[job.next].t > elapsed) continue;
    if (performance.now() > deadline) break;
    if (activeCanvas !== job.canvas) {
      brush.load(job.canvas);
      activeCanvas = job.canvas;
    }
    setScale(brush, job.scale);
    // At least one step per frame, then as many as the budget allows.
    let first = true;
    while (job.next < job.steps.length && job.steps[job.next].t <= elapsed && (first || performance.now() < deadline)) {
      first = false;
      try {
        job.steps[job.next++].draw(brush, job.origin);
      } catch {
        // A failed stroke must not stop the rest of the painting.
      }
    }
    brush.render();
    if (job.next >= job.steps.length) {
      jobs.delete(job);
      job.onDone?.();
    }
  }
  frame = jobs.size ? requestAnimationFrame((t) => tick(brush, t)) : 0;
}

export type PaintOptions = {
  host: HTMLElement;
  width: number;
  height: number;
  paper: string;
  seed: string;
  steps: Step[];
  duration: number;
  onDone?: () => void;
};

/** Creates a canvas in `host` and paints `steps` over `duration` ms. Returns a cancel function. */
export async function paint(opts: PaintOptions) {
  const brush = await loadBrush();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const density = Math.min(window.devicePixelRatio || 1, opts.width > 900 ? 1.25 : 2);

  const canvas = brush.createCanvas(opts.width, opts.height, { parent: opts.host, pixelDensity: density });
  activeCanvas = canvas;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  brush.seed(opts.seed);
  brush.noiseSeed(opts.seed);
  brush.clear(opts.paper);
  const scale = Math.max(0.8, Math.min(opts.width, opts.height) / 400);
  setScale(brush, scale);
  brush.render();

  const origin: Origin = ([x, y]: Pt) => [x - opts.width / 2, y - opts.height / 2];
  const job: Job = {
    canvas,
    steps: [...opts.steps].sort((a, b) => a.t - b.t),
    origin,
    start: performance.now(),
    duration: reduced ? 0 : opts.duration,
    next: 0,
    scale,
    onDone: opts.onDone,
  };
  jobs.add(job);
  if (!frame) frame = requestAnimationFrame((t) => tick(brush, t));

  return () => {
    jobs.delete(job);
    canvas.remove();
  };
}
