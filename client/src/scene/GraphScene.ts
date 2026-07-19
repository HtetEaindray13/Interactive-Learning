import { sampleGraph } from './graphMath';
import type { GraphConfig, SceneHandle } from './types';

function niceRange(values: number[]): [number, number] {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) {
    return [-10, 10];
  }

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const padding = Math.max((max - min) * 0.12, 1);
  return [Math.floor(min - padding), Math.ceil(max + padding)];
}

function drawGraph(canvas: HTMLCanvasElement, config: GraphConfig) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(rect.width, 320);
  const height = Math.max(rect.height, 260);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);

  const margin = { top: 28, right: 28, bottom: 38, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const points = sampleGraph(config);
  const rawXMin = Number(config.xMin) || -10;
  const rawXMax = Number(config.xMax) || 10;
  const xMin = Math.min(rawXMin, rawXMax - 1);
  const xMax = Math.max(rawXMax, xMin + 1);
  const [yMin, yMax] = niceRange(points.map((point) => point.y));

  const toCanvasX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const toCanvasY = (y: number) => margin.top + (1 - (y - yMin) / (yMax - yMin)) * plotHeight;

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';

  for (let i = 0; i <= 10; i++) {
    const x = margin.left + (plotWidth * i) / 10;
    const y = margin.top + (plotHeight * i) / 10;
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, margin.top + plotHeight);
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + plotWidth, y);
    ctx.stroke();
  }

  const zeroX = xMin <= 0 && xMax >= 0 ? toCanvasX(0) : margin.left;
  const zeroY = yMin <= 0 && yMax >= 0 ? toCanvasY(0) : margin.top + plotHeight;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(zeroX, margin.top);
  ctx.lineTo(zeroX, margin.top + plotHeight);
  ctx.moveTo(margin.left, zeroY);
  ctx.lineTo(margin.left + plotWidth, zeroY);
  ctx.stroke();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = toCanvasX(point.x);
    const y = toCanvasY(point.y);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 14px system-ui, sans-serif';
  const equation = config.functionType === 'quadratic'
    ? `y = ${config.coefficientA}x^2 + ${config.coefficientB}x + ${config.coefficientC}`
    : config.functionType === 'sine'
      ? `y = ${config.coefficientA} sin(${config.coefficientB}x) + ${config.coefficientC}`
      : config.functionType === 'cosine'
        ? `y = ${config.coefficientA} cos(${config.coefficientB}x) + ${config.coefficientC}`
        : `y = ${config.coefficientA}x + ${config.coefficientB}`;
  ctx.fillText(equation, margin.left, 20);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(String(xMin), margin.left, height - 12);
  ctx.fillText(String(xMax), margin.left + plotWidth - 18, height - 12);
  ctx.fillText(String(yMax), 10, margin.top + 4);
  ctx.fillText(String(yMin), 10, margin.top + plotHeight);
}

export function initGraphScene(
  container: HTMLElement,
  config: GraphConfig
): SceneHandle<GraphConfig> {
  const canvas = document.createElement('canvas');
  canvas.className = 'graph-canvas';
  container.appendChild(canvas);

  let currentConfig = config;

  function render() {
    drawGraph(canvas, currentConfig);
  }

  function onResize() {
    render();
  }

  window.addEventListener('resize', onResize);
  render();

  return {
    update(nextConfig: GraphConfig) {
      currentConfig = nextConfig;
      render();
    },
    dispose() {
      window.removeEventListener('resize', onResize);
      container.removeChild(canvas);
    },
  };
}
