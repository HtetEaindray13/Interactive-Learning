import { existsSync, readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');
const generatedModelDir = join(projectRoot, 'client/public/models/generated');

function slugifyTopic(topic) {
  return String(topic ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readModelMeta(slug) {
  const metaPath = join(generatedModelDir, `${slug}.meta.json`);
  if (!existsSync(metaPath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch (err) {
    console.warn(`Could not read model metadata for ${slug}:`, err);
    return {};
  }
}

export function resolveTeachingModel(topic) {
  const slug = slugifyTopic(topic);
  if (!slug) {
    return {
      modelUrl: '',
      modelStatus: 'fallback_2_5d',
      modelMessage: 'Interactive 3D teaching view is ready for exploration.',
    };
  }

  const localModelPath = join(generatedModelDir, `${slug}.glb`);
  if (existsSync(localModelPath)) {
    const meta = readModelMeta(slug);
    const version = Math.round(statSync(localModelPath).mtimeMs);
    return {
      modelUrl: `/models/generated/${slug}.glb?v=${version}`,
      modelStatus: 'ready',
      modelMessage:
        meta.message ?? 'A 3D model is available for this teaching material.',
      modelView: meta.view,
    };
  }

  if (process.env.MESHY_API_KEY || process.env.TRIPO_API_KEY) {
    return {
      modelUrl: '',
      modelStatus: 'generating',
      modelMessage:
        'A 2D-to-3D provider key is configured. The next step is to connect the provider job API and save the exported GLB here.',
    };
  }

  return {
    modelUrl: '',
    modelStatus: 'fallback_2_5d',
    modelMessage: 'Interactive 3D teaching view is ready for rotation, zooming, and inspection.',
  };
}

export function attachModelGenerationState(config) {
  if (config?.sceneType !== 'teaching_material') {
    return config;
  }

  return {
    ...config,
    ...resolveTeachingModel(config.topic),
  };
}
