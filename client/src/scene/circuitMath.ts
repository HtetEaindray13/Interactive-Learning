export function seriesResistance(resistancePerBulb: number, count: number): number {
  if (resistancePerBulb <= 0) {
    throw new Error('resistancePerBulb must be positive');
  }
  if (count <= 0 || !Number.isInteger(count)) {
    throw new Error('count must be a positive integer');
  }
  return resistancePerBulb * count;
}

export function parallelResistance(resistancePerBulb: number, count: number): number {
  if (resistancePerBulb <= 0) {
    throw new Error('resistancePerBulb must be positive');
  }
  if (count <= 0 || !Number.isInteger(count)) {
    throw new Error('count must be a positive integer');
  }
  return 1 / ((1 / resistancePerBulb) * count);
}

export function bulbBrightness(
  voltage: number,
  totalResistance: number,
  circuitType: 'series' | 'parallel',
  count: number
): number {
  if (voltage <= 0) {
    throw new Error('voltage must be positive');
  }
  if (totalResistance <= 0) {
    throw new Error('totalResistance must be positive (avoid division by zero)');
  }
  if (count <= 0) {
    throw new Error('count must be positive');
  }

  const totalCurrent = voltage / totalResistance;
  const currentPerBulb = circuitType === 'series' ? totalCurrent : totalCurrent / count;
  return Math.min(1, currentPerBulb / 1.0);
}
