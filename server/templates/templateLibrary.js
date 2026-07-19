import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadTemplate(fileName) {
  const templatePath = join(__dirname, fileName);
  return JSON.parse(readFileSync(templatePath, 'utf-8'));
}

export function getTemplates() {
  return readdirSync(__dirname)
    .filter((fileName) => fileName.endsWith('.json'))
    .map(loadTemplate);
}

export function getPublicTemplates() {
  return getTemplates().map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    sceneType: template.sceneType,
    subject: template.subject,
    concepts: template.concepts,
    ageRange: template.ageRange,
  }));
}

export function getTemplateById(templateId) {
  return getTemplates().find((template) => template.id === templateId) ?? null;
}

export function selectTemplate(parsedCurriculum, curriculumText) {
  const templates = getTemplates();
  const searchText = [
    curriculumText,
    parsedCurriculum?.subject,
    parsedCurriculum?.topic,
    parsedCurriculum?.objective,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const bySceneType = new Map(templates.map((template) => [template.sceneType, template]));
  const wantsInteractiveLab = /\b(3d|model|simulation|simulator|virtual lab|lab|rotate|circuit lab|volcano lab|rainforest scene)\b/.test(searchText);

  if (/\b(graph|slope|linear|function|coordinate|quadratic|parabola|equation|y\s*=)\b/.test(searchText)) {
    return bySceneType.get('graph_2d') ?? templates[0];
  }

  if (wantsInteractiveLab && /\b(circuit|electricity|series|parallel|battery|bulb|voltage|resistance)\b/.test(searchText)) {
    return bySceneType.get('circuit') ?? templates[0];
  }

  if (wantsInteractiveLab && /\b(volcano|eruption|magma|lava|crust|mantle|core|tectonic)\b/.test(searchText)) {
    return bySceneType.get('volcano') ?? templates[0];
  }

  if (wantsInteractiveLab && /\b(tiger|animal|plant|planet|machine|object|photo|label|teaching material)\b/.test(searchText)) {
    return bySceneType.get('teaching_material') ?? templates[0];
  }

  if (/\b(teaching|material|photo|image|diagram|map|history|science|biology|geography|physics|chemistry|astronomy|animal|plant|planet|machine|object|tiger|volcano|flower|circuit|solar|source|search)\b/.test(searchText)) {
    return bySceneType.get('visual_material') ?? templates[0];
  }

  const scoredTemplates = templates.map((template) => {
    const terms = [
      template.subject,
      ...(template.concepts ?? []),
      ...(template.keywords ?? []),
    ].filter(Boolean);

    const score = terms.reduce((total, term) => {
      return searchText.includes(String(term).toLowerCase()) ? total + 1 : total;
    }, 0);

    return { template, score };
  });

  scoredTemplates.sort((a, b) => b.score - a.score);
  return scoredTemplates[0]?.score > 0
    ? scoredTemplates[0].template
    : bySceneType.get('visual_material') ?? templates[0];
}
