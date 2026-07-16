import { extractJson, getModel } from './geminiUtils.js';

/**
 * Step 1: Parse raw teacher curriculum text into structured fields.
 * @param {string} curriculumText
 * @returns {Promise<{ subject: string, topic: string, ageLevel: string, objective: string }>}
 */
export async function parseCurriculum(curriculumText) {
  const model = getModel();

  const prompt = `You are a curriculum parser for a lab-simulation system.
Given a teacher's lesson description, extract STRICT JSON only, no prose:
{ "subject": "...", "topic": "...", "ageLevel": "...", "objective": "..." }

Teacher input: "${curriculumText.replace(/"/g, '\\"')}"`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = extractJson(text);
    return {
      subject: parsed.subject ?? '',
      topic: parsed.topic ?? '',
      ageLevel: parsed.ageLevel ?? '',
      objective: parsed.objective ?? '',
    };
  } catch (err) {
    console.error('parseCurriculum JSON parse failed. Raw model output:', text);
    throw new Error(`Failed to parse curriculum response as JSON: ${err.message}`);
  }
}
