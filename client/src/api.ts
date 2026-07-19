import type { LabConfig } from './scene/types';

export interface LabTemplate {
  id: string;
  name: string;
  description: string;
  sceneType: string;
  subject: string;
  concepts: string[];
  ageRange: [number, number];
}

export async function getTemplates(): Promise<LabTemplate[]> {
  const response = await fetch('/api/templates');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to load templates');
  }

  return data as LabTemplate[];
}

export async function configureLab(curriculumText: string): Promise<LabConfig> {
  const response = await fetch('/api/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curriculumText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to configure lab');
  }

  return data as LabConfig;
}
