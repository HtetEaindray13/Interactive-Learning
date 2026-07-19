import type { GraphConfig } from './types';

export interface GraphPoint {
  x: number;
  y: number;
}

export function evaluateFunction(config: GraphConfig, x: number): number {
  const a = Number(config.coefficientA) || 0;
  const b = Number(config.coefficientB) || 0;
  const c = Number(config.coefficientC) || 0;

  if (config.functionType === 'quadratic') {
    return a * x * x + b * x + c;
  }

  if (config.functionType === 'sine') {
    return a * Math.sin(b * x) + c;
  }

  if (config.functionType === 'cosine') {
    return a * Math.cos(b * x) + c;
  }

  return a * x + b;
}

export function sampleGraph(config: GraphConfig, samples = 160): GraphPoint[] {
  const xMin = Number.isFinite(Number(config.xMin)) ? Number(config.xMin) : -10;
  const xMax = Number.isFinite(Number(config.xMax)) ? Number(config.xMax) : 10;
  const start = Math.min(xMin, xMax - 1);
  const end = Math.max(xMax, start + 1);

  return Array.from({ length: samples + 1 }, (_, index) => {
    const t = index / samples;
    const x = start + (end - start) * t;
    return { x, y: evaluateFunction(config, x) };
  });
}
