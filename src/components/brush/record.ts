import type { Origin, Pt, Step } from "./botany";

/**
 * Paints a scene with p5.brush (WebGL2) and captures it at evenly spaced
 * moments of its timeline. Used only by the development recorder page to
 * produce the WebP frame sequences the site plays back.
 */
export async function recordFrames(
  steps: Step[],
  opts: { width: number; height: number; paper: string; seed: string; density: number; frames: number; quality: number },
): Promise<Blob[]> {
  const brush = await import("p5.brush/standalone");
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-99999px;top:0";
  document.body.appendChild(host);

  const canvas = brush.createCanvas(opts.width, opts.height, { parent: host, pixelDensity: opts.density });
  brush.seed(opts.seed);
  brush.noiseSeed(opts.seed);
  brush.clear(opts.paper);
  // Brush sizes are relative to the scene; scale once from the default of 1.
  brush.scaleBrushes(Math.max(0.8, Math.min(opts.width, opts.height) / 400));
  const origin: Origin = ([x, y]: Pt) => [x - opts.width / 2, y - opts.height / 2];

  const ordered = [...steps].sort((a, b) => a.t - b.t);
  const blobs: Blob[] = [];
  let next = 0;
  for (let f = 1; f <= opts.frames; f++) {
    const until = f / opts.frames;
    while (next < ordered.length && (ordered[next].t <= until || f === opts.frames)) {
      try {
        ordered[next++].draw(brush, origin);
      } catch {
        // Skip a failed stroke; the rest of the plant still paints.
      }
    }
    brush.render();
    blobs.push(await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", opts.quality)));
  }

  // Undo the scale so the next recording starts from the defaults.
  brush.scaleBrushes(1 / Math.max(0.8, Math.min(opts.width, opts.height) / 400));
  host.remove();
  return blobs;
}
