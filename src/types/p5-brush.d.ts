// p5.brush ships no type definitions; this covers the standalone calls we use.
declare module "p5.brush/standalone" {
  type Point = [number, number];
  export function createCanvas(
    width: number,
    height: number,
    options?: { pixelDensity?: number; parent?: string | Element | null; id?: string },
  ): HTMLCanvasElement;
  export function render(): void;
  export function load(target: HTMLCanvasElement | OffscreenCanvas): void;
  export function clear(color?: string): void;
  export function seed(value: number | string): void;
  export function noiseSeed(value: number | string): void;
  export function scaleBrushes(factor: number): void;
  export function set(brush: string, color: string, weight?: number): void;
  export function noStroke(): void;
  export function fill(color: string, opacity?: number): void;
  export function noFill(): void;
  export function fillBleed(strength: number, direction?: "in" | "out"): void;
  export function fillTexture(texture?: number, border?: number): void;
  export function hatch(dist?: number, angle?: number): void;
  export function noHatch(): void;
  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function spline(points: Point[], curvature?: number): void;
  export function polygon(points: Point[]): void;
  export function rect(x: number, y: number, w: number, h: number, mode?: "center"): void;
  export function circle(x: number, y: number, radius: number): void;
}
