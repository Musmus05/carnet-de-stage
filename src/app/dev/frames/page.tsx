import { notFound } from "next/navigation";
import { Recorder } from "./recorder";

// Development tool: records the p5.brush paintings into public/frames.
export default function FramesPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Recorder />;
}
