import { extractJson, getModel } from './geminiUtils.js';

function configSchemaForTemplate(template) {
  if (template.sceneType === 'teaching_material') {
    return `{
  "topic": "teacher topic",
  "title": "short teaching material title",
  "photoUrl": "real photo URL",
  "modelHint": "how the 3D-style view should behave",
  "labels": [
    { "text": "label", "x": <number -1 to 1>, "y": <number -1 to 1> }
  ],
  "facts": ["short fact", "short fact"],
  "guidingQuestions": [],
  "narration": "one paragraph, age-appropriate, introducing the topic"
}`;
  }

  if (template.sceneType === 'animal_habitat') {
    return `{
  "habitatType": "rainforest" | "savanna" | "wetland",
  "climate": "humid" | "dry" | "temperate",
  "showLabels": <boolean>,
  "difficulty": "easy" | "medium" | "hard",
  "animals": [
    {
      "name": "animal name",
      "role": "predator | herbivore | omnivore | pollinator | decomposer",
      "diet": "short diet description",
      "habitat": "where it lives in the habitat",
      "fact": "one age-appropriate fact",
      "imageUrl": "real photo URL"
    }
  ],
  "guidingQuestions": ["...", "..."],
  "narration": "one paragraph, age-appropriate, introducing the habitat"
}`;
  }

  if (template.sceneType === 'volcano') {
    return `{
  "eruptionLevel": <integer 0-3>,
  "showLabels": <boolean>,
  "difficulty": "easy" | "medium" | "hard",
  "focusArea": "volcano" | "earth_layers" | "both",
  "guidingQuestions": ["...", "..."],
  "narration": "one paragraph, age-appropriate, introducing the lab"
}`;
  }

  if (template.sceneType === 'graph_2d') {
    return `{
  "functionType": "linear" | "quadratic" | "sine" | "cosine",
  "coefficientA": <number>,
  "coefficientB": <number>,
  "coefficientC": <number>,
  "xMin": <number>,
  "xMax": <number>,
  "guidingQuestions": ["...", "..."],
  "narration": "one paragraph, age-appropriate, introducing the graph"
}`;
  }

  return `{
  "circuitType": "series" | "parallel",
  "numberOfBulbs": <int>,
  "batteryVoltage": <number>,
  "resistancePerBulb": <number>,
  "guidingQuestions": ["...", "..."],
  "narration": "one paragraph, age-appropriate, introducing the lab"
}`;
}

function normalizeByTemplate(parsed, parsedCurriculum, template) {
  const baseConfig = {
    guidingQuestions: parsed.guidingQuestions ?? template.defaultHints ?? [],
    narration: parsed.narration ?? '',
    objective: parsedCurriculum.objective,
    topic: parsedCurriculum.topic,
    ageLevel: parsedCurriculum.ageLevel,
    subject: parsedCurriculum.subject || template.subject,
    templateId: template.id,
    templateName: template.name,
    sceneType: template.sceneType,
    adjustableVariables: template.adjustableVariables,
    allowed: true,
    matchedTemplate: template.id,
  };

  if (template.sceneType === 'volcano') {
    return {
      ...baseConfig,
      eruptionLevel: Number.isInteger(parsed.eruptionLevel) ? parsed.eruptionLevel : 1,
      showLabels: typeof parsed.showLabels === 'boolean' ? parsed.showLabels : true,
      difficulty: parsed.difficulty ?? 'easy',
      focusArea: parsed.focusArea ?? 'both',
    };
  }

  if (template.sceneType === 'animal_habitat') {
    return {
      ...baseConfig,
      habitatType: parsed.habitatType ?? 'rainforest',
      climate: parsed.climate ?? 'humid',
      showLabels: typeof parsed.showLabels === 'boolean' ? parsed.showLabels : true,
      difficulty: parsed.difficulty ?? 'easy',
      animals: Array.isArray(parsed.animals) ? parsed.animals : [],
    };
  }

  if (template.sceneType === 'teaching_material') {
    return {
      ...baseConfig,
      topic: parsed.topic ?? parsedCurriculum.topic ?? parsedCurriculum.objective,
      title: parsed.title ?? `Teaching Material: ${parsed.topic ?? parsedCurriculum.topic ?? 'Topic'}`,
      photoUrl: parsed.photoUrl ?? '',
      modelHint: parsed.modelHint ?? 'Interactive 3D-style photo cutout',
      labels: Array.isArray(parsed.labels) ? parsed.labels : [],
      facts: Array.isArray(parsed.facts) ? parsed.facts : [],
    };
  }

  if (template.sceneType === 'graph_2d') {
    return {
      ...baseConfig,
      functionType: parsed.functionType ?? 'linear',
      coefficientA: Number.isFinite(Number(parsed.coefficientA)) ? Number(parsed.coefficientA) : 1,
      coefficientB: Number.isFinite(Number(parsed.coefficientB)) ? Number(parsed.coefficientB) : 0,
      coefficientC: Number.isFinite(Number(parsed.coefficientC)) ? Number(parsed.coefficientC) : 0,
      xMin: Number.isFinite(Number(parsed.xMin)) ? Number(parsed.xMin) : -10,
      xMax: Number.isFinite(Number(parsed.xMax)) ? Number(parsed.xMax) : 10,
    };
  }

  return {
    ...baseConfig,
    circuitType: parsed.circuitType,
    numberOfBulbs: parsed.numberOfBulbs,
    batteryVoltage: parsed.batteryVoltage,
    resistancePerBulb: parsed.resistancePerBulb,
  };
}

/**
 * Step 2: Customize the selected lab template for a parsed lesson.
 * @param {{ subject: string, topic: string, ageLevel: string, objective: string }} parsedCurriculum
 * @param {object} template
 * @returns {Promise<object>} Config with scene variables, guidingQuestions, and narration
 */
export async function customizeTemplate(parsedCurriculum, template) {
  const model = getModel();
  const { objective, ageLevel } = parsedCurriculum;
  const adjustableVariables = template.adjustableVariables;
  const configSchema = configSchemaForTemplate(template);

  const prompt = `You are configuring a 3D ${template.name} for a specific lesson.
Template constraints: ${JSON.stringify(adjustableVariables)}
Lesson objective: ${objective}
Age level: ${ageLevel}

Return STRICT JSON only:
${configSchema}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = extractJson(text);
    return normalizeByTemplate(parsed, parsedCurriculum, template);
  } catch (err) {
    console.error('customizeTemplate JSON parse failed. Raw model output:', text);
    throw new Error(`Failed to parse template customization response as JSON: ${err.message}`);
  }
}
