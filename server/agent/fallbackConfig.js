function extractAgeLevel(text) {
  const gradeMatch = text.match(/\b(?:grade|year)\s*(\d{1,2})\b/i);
  if (gradeMatch) {
    return `Grade ${gradeMatch[1]}`;
  }

  const ageMatch = text.match(/\bages?\s*(\d{1,2})(?:\s*[-to]+\s*(\d{1,2}))?\b/i);
  if (ageMatch) {
    return ageMatch[2] ? `Ages ${ageMatch[1]}-${ageMatch[2]}` : `Age ${ageMatch[1]}`;
  }

  return 'Elementary';
}

function extractObjective(text) {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return 'Explore how changing circuit variables affects bulb brightness.';
  }

  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

function inferCircuitType(text) {
  const lowered = text.toLowerCase();
  const mentionsParallel = lowered.includes('parallel');
  const mentionsSeries = lowered.includes('series');

  if (mentionsParallel && !mentionsSeries) {
    return 'parallel';
  }

  return 'series';
}

export function createFallbackConfig(curriculumText, reason = 'Gemini quota is currently unavailable.') {
  const circuitType = inferCircuitType(curriculumText);
  const objective = extractObjective(curriculumText);

  return {
    circuitType,
    numberOfBulbs: circuitType === 'series' ? 3 : 2,
    batteryVoltage: 6,
    resistancePerBulb: 4,
    guidingQuestions: [
      'What happens to bulb brightness when you add another bulb?',
      'How does the circuit path affect the current through each bulb?',
      'What would you change to make the bulbs brighter?',
    ],
    narration:
      'Build the circuit and observe how the bulbs respond. Change one variable at a time, then compare the brightness and current to explain what is happening.',
    objective,
    topic: 'electric circuits',
    ageLevel: extractAgeLevel(curriculumText),
    subject: 'physics',
    source: 'local-fallback',
    warning: reason,
  };
}
