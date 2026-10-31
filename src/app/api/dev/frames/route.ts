import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Development only: stores recorded painting frames under public/frames.
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });

  const url = new URL(request.url);
  const name = url.searchParams.get("name") ?? "";
  const index = url.searchParams.get("i") ?? "";
  if (!/^[a-z0-9-]+$/.test(name) || !/^\d{2}$/.test(index)) return new Response("bad name", { status: 400 });

  const dir = path.join(process.cwd(), "public", "frames", name);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${index}.webp`), Buffer.from(await request.arrayBuffer()));
  return Response.json({ ok: true });
}
