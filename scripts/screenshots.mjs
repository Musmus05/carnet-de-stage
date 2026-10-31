// Captures the README screenshots from the local app with headless Edge or Chrome.
// Usage: npm run dev (and npx supabase start), then: node scripts/screenshots.mjs
// Set BROWSER to another Chromium executable if needed.
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const BROWSER = process.env.BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = path.resolve("docs/screenshots");
const PORT = 9333;
const DEMO = { email: "demo@herbarium.test", password: "demo-herbarium-2026" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = await mkdtemp(path.join(os.tmpdir(), "herbarium-shots-"));
const browser = spawn(BROWSER, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--hide-scrollbars",
  "--no-first-run",
  "about:blank",
]);

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    target = list.find((t) => t.type === "page");
  } catch {
    // Browser still starting.
  }
}
if (!target) throw new Error("Browser did not start");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
const listeners = new Set();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else listeners.forEach((fn) => fn(msg));
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, (msg) => (msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

async function open(url, wait = 1500) {
  const loaded = new Promise((r) => {
    const fn = (msg) => msg.method === "Page.loadEventFired" && (listeners.delete(fn), r());
    listeners.add(fn);
  });
  await send("Page.navigate", { url: BASE + url });
  await loaded;
  await sleep(wait);
}

async function shoot(name, { width = 1440, height = 900, full = false, dir = OUT } = {}) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  // Hide the Next.js development badge.
  await evaluate("document.querySelectorAll('nextjs-portal').forEach((e) => e.remove())");
  await sleep(300);
  let clip;
  if (full) {
    const h = await evaluate("document.documentElement.scrollHeight");
    clip = { x: 0, y: 0, width, height: h, scale: 1 };
  }
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full, clip });
  await writeFile(path.join(dir, `${name}.png`), Buffer.from(data, "base64"));
  console.log("saved", name);
}

// Plates for the README: recorded frames laid out on paper, so they read
// well on GitHub in light and dark mode.
const PLANTS = path.resolve("docs/plants");
const STAGES = [
  ["seed", "À postuler"],
  ["bud", "Envoyée"],
  ["flower", "Entretien"],
  ["fruit", "Offre"],
  ["wilted", "Refus"],
  ["faded", "Sans réponse"],
];

function plateHtml(cells, columns) {
  const items = cells
    .map(([src, caption]) => `<figure><img src="${src}"><figcaption>${caption ?? ""}</figcaption></figure>`)
    .join("");
  return `<html><head><style>
    body { margin: 0; background: #e9ece2; font-family: Georgia, serif; }
    main { display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 14px; padding: 22px; }
    figure { margin: 0; background: #f7f8f2; border: 1px solid #aeb4a1; padding: 10px 10px 8px; }
    img { display: block; width: 100%; aspect-ratio: 360 / 400; object-fit: contain; }
    figcaption { font-size: 15px; color: #514b41; text-align: center; margin-top: 6px; min-height: 1em; }
  </style></head><body><main>${items}</main></body></html>`;
}

async function plate(name, cells, columns, width) {
  const { frameTree } = await send("Page.getFrameTree");
  await send("Page.setDocumentContent", { frameId: frameTree.frame.id, html: plateHtml(cells, columns) });
  await evaluate("Promise.all([...document.images].map((i) => i.decode().catch(() => {})))");
  await shoot(name, { width, height: 100, full: true, dir: PLANTS });
}

async function plates() {
  await mkdir(PLANTS, { recursive: true });
  await open("/", 300);
  const frame = (seq, i) => `${BASE}/frames/${seq}/${String(i).padStart(2, "0")}.webp`;
  await plate("growth", [1, 3, 5, 7, 9].map((i, k) => [frame("specimen-fruit-6", i), `${k + 1}`]), 5, 1200);
  await plate("stages", STAGES.map(([stage, label]) => [frame(`specimen-${stage}-11`, 9), label]), 6, 1320);
  await plate("gallery", Array.from({ length: 12 }, (_, v) => [frame(`specimen-flower-${v + 2}`, 9), ""]), 6, 1320);
}

try {
  await mkdir(OUT, { recursive: true });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  // Headless browsers render WebGL in software: use the recorded paintings.
  await open("/", 200);
  await evaluate("localStorage.setItem('herbarium:brush-slow', '1')");

  await open("/", 5500);
  await shoot("landing");
  await open("/login?mode=signup", 5500);
  await shoot("login");

  await open("/login", 1000);
  await evaluate(`(() => {
    const set = (id, v) => { const el = document.getElementById(id); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
    set("email", ${JSON.stringify(DEMO.email)}); set("password", ${JSON.stringify(DEMO.password)});
    document.querySelector("button[value=signin]").click();
  })()`);
  await sleep(4000);

  await open("/app", 2500);
  await shoot("overview", { height: 1240 });
  await open("/app/applications", 2000);
  await shoot("applications");
  const detail = await evaluate(`[...document.querySelectorAll("a")].find((a) => a.textContent.trim() === "Institut des Marées")?.getAttribute("href")`);
  await open(detail, 4000);
  await shoot("application");
  await open("/app/applications/new", 1500);
  await shoot("new-application");
  await open(`${detail}/edit`, 1500);
  await shoot("edit-application", { height: 1320 });
  await open("/app/cvs", 2000);
  await shoot("cvs");
  await open("/app/profile", 2000);
  await shoot("profile", { height: 1480 });
  await open("/app", 2500);
  await shoot("mobile-overview", { width: 390, height: 844 });

  await plates();
} finally {
  ws.close();
  browser.kill();
  await sleep(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
