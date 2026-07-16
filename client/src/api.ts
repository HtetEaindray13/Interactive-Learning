import type { CircuitConfig } from './scene/CircuitScene';

export async function configureLab(curriculumText: string): Promise<CircuitConfig> {
  const response = await fetch('/api/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curriculumText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to configure lab');
  }

  return data as CircuitConfig;
}

export interface SessionSummary {
  objective: string;
  questionsAnswered: number;
  totalQuestions: number;
  timeSpentSeconds: number;
}

export async function saveSession(summary: SessionSummary): Promise<void> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to save session');
  }
}
