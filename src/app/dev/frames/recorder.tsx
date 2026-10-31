"use client";

import { useState } from "react";
import {
  LANDING_FOREST,
  LOGIN_FOREST,
  SPECIMEN_STAGES,
  SPECIMEN_VARIANTS,
  specimenSequence,
  type Sequence,
} from "@/components/brush/catalog";
import { recordFrames } from "@/components/brush/record";
import { forestScene, specimenScene } from "@/components/brush/scenes";
import type { Step } from "@/components/brush/botany";

type Job = { seq: Sequence; seed: string; steps: Step[]; density: number };

function jobs(): Job[] {
  const list: Job[] = [];
  for (const onSheet of [false, true]) {
    // Empty states only ever show a seed on the page ground.
    for (const stage of onSheet ? (["seed"] as const) : SPECIMEN_STAGES) {
      for (let v = 0; v < SPECIMEN_VARIANTS; v++) {
        const seq = specimenSequence(stage, v, onSheet);
        const seed = `specimen-${v}`;
        list.push({ seq, seed, steps: specimenScene(seed, stage, seq.width, seq.height), density: 1.5 });
      }
    }
  }
  const landing = LANDING_FOREST;
  list.push({ seq: landing, seed: "landing-forest", density: 1, steps: forestScene("landing-forest", landing.width, landing.height, "sheet", { from: 0, to: 0.52 }) });
  const login = LOGIN_FOREST;
  list.push({ seq: login, seed: "login-forest", density: 1, steps: forestScene("login-forest", login.width, login.height, "fern") });
  return list;
}

export function Recorder() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function run(filter: string) {
    setBusy(true);
    const all = jobs().filter((j) => j.seq.name.includes(filter));
    for (const job of all) {
      const blobs = await recordFrames(job.steps, { ...job.seq, seed: job.seed, density: job.density, quality: 0.78 });
      let bytes = 0;
      for (let i = 0; i < blobs.length; i++) {
        bytes += blobs[i].size;
        await fetch(`/api/dev/frames?name=${job.seq.name}&i=${String(i).padStart(2, "0")}`, { method: "POST", body: blobs[i] });
      }
      setLog((l) => [...l, `${job.seq.name}: ${blobs.length} frames, ${Math.round(bytes / 1024)} KB`]);
    }
    setLog((l) => [...l, "done"]);
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="font-serif text-2xl font-semibold">Frame recorder</h1>
      <div className="mt-4 flex gap-2">
        <button disabled={busy} onClick={() => run("")} className="rounded border px-3 py-1">
          Record all
        </button>
        <button disabled={busy} onClick={() => run("forest")} className="rounded border px-3 py-1">
          Forests only
        </button>
      </div>
      <pre id="log" className="mt-6 text-sm">{log.join("\n")}</pre>
    </main>
  );
}
