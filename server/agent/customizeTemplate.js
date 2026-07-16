import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractJson, getModel } from './geminiUtils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../templates/circuit.json');
const circuitTemplate = JSON.parse(readFileSync(templatePath, 'utf-8'));

/**
 * Step 2: Customize the circuit template for a parsed lesson.
 * @param {{ subject: string, topic: string, ageLevel: string, objective: string }} parsedCurriculum
 * @returns {Promise<object>} Config with circuit variables, guidingQuestions, and narration
 */
export async function customizeTemplate(parsedCurriculum) {
  const model = getModel();
  const { objective, ageLevel } = parsedCurriculum;
  const adjustableVariables = circuitTemplate.adjustableVariables;

  const prompt = `You are configuring a 3D circuit lab for a specific lesson.
Template constraints: ${JSON.stringify(adjustableVariables)}
Lesson objective: ${objective}
Age level: ${ageLevel}

Return STRICT JSON only:
{
  "circuitType": "series" | "parallel",
  "numberOfBulbs": <int>,
  "batteryVoltage": <number>,
  "resistancePerBulb": <number>,
  "guidingQuestions": ["...", "..."],
  "narration": "one paragraph, age-appropriate, introducing the lab"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = extractJson(text);
    return {
      circuitType: parsed.circuitType,
      numberOfBulbs: parsed.numberOfBulbs,
      batteryVoltage: parsed.batteryVoltage,
      resistancePerBulb: parsed.resistancePerBulb,
      guidingQuestions: parsed.guidingQuestions ?? [],
      narration: parsed.narration ?? '',
      objective,
      topic: parsedCurriculum.topic,
      ageLevel: parsedCurriculum.ageLevel,
      subject: parsedCurriculum.subject,
    };
  } catch (err) {
    console.error('customizeTemplate JSON parse failed. Raw model output:', text);
    throw new Error(`Failed to parse template customization response as JSON: ${err.message}`);
  }
}
