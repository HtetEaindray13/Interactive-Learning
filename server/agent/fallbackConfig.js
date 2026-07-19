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

function inferDifficulty(text) {
  const lowered = text.toLowerCase();
  if (/\b(advanced|hard|challenge|grade\s*(7|8|9|10|11|12))\b/.test(lowered)) {
    return 'hard';
  }
  if (/\b(intermediate|medium|grade\s*(5|6))\b/.test(lowered)) {
    return 'medium';
  }
  return 'easy';
}

function inferVolcanoConfig(curriculumText, reason, template) {
  const lowered = curriculumText.toLowerCase();
  const objective = extractObjective(curriculumText);
  const eruptionLevel = lowered.includes('violent') || lowered.includes('strong') || lowered.includes('explosive')
    ? 3
    : lowered.includes('small') || lowered.includes('gentle')
      ? 1
      : 2;
  const focusArea = lowered.includes('earth layer') || lowered.includes('crust') || lowered.includes('mantle') || lowered.includes('core')
    ? lowered.includes('volcano') || lowered.includes('eruption')
      ? 'both'
      : 'earth_layers'
    : 'volcano';

  return {
    templateId: template?.id ?? 'volcano_basic',
    templateName: template?.name ?? 'Volcano and Earth Layers Lab',
    sceneType: 'volcano',
    eruptionLevel,
    showLabels: !lowered.includes('no labels'),
    difficulty: inferDifficulty(curriculumText),
    focusArea,
    guidingQuestions: [
      'Where does magma move before it reaches the crater?',
      'How does eruption level change the lava and ash you observe?',
      'Which Earth layer sits under the crust?',
      'Why are labels useful when comparing the volcano and Earth layers?',
    ],
    narration:
      'Explore a virtual volcano and the layers inside Earth. Change your observations between the crater, lava flow, and Earth-layer model to explain how magma moves from inside Earth to the surface.',
    objective,
    topic: 'volcanoes and Earth layers',
    ageLevel: extractAgeLevel(curriculumText),
    subject: 'geography',
    source: 'local-fallback',
    warning: reason,
  };
}

function inferAnimalHabitatConfig(curriculumText, reason, template) {
  const lowered = curriculumText.toLowerCase();
  const objective = extractObjective(curriculumText);
  const habitatType = lowered.includes('savanna')
    ? 'savanna'
    : lowered.includes('wetland')
      ? 'wetland'
      : 'rainforest';
  const climate = habitatType === 'savanna' ? 'dry' : habitatType === 'wetland' ? 'temperate' : 'humid';

  const animalLibrary = [
    {
      name: 'Tiger',
      role: 'Predator',
      diet: 'Deer, wild pigs, and other medium-sized animals',
      habitat: 'Dense forest floor with cover for hunting',
      fact: 'Tigers use stripes as camouflage in tall grass and forest shadows.',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg/500px-Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg',
    },
    {
      name: 'Monkey',
      role: 'Omnivore',
      diet: 'Fruit, leaves, seeds, insects, and sometimes eggs',
      habitat: 'Tree canopy and branches above the forest floor',
      fact: 'Many monkeys help forests grow by spreading seeds after eating fruit.',
      imageUrl: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Toucan',
      role: 'Fruit eater',
      diet: 'Fruit, insects, and small reptiles',
      habitat: 'Upper rainforest canopy and tree holes',
      fact: 'A toucan uses its large bill to reach fruit on branches that are too small to hold its body.',
      imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return {
    templateId: template?.id ?? 'animal_habitat_basic',
    templateName: template?.name ?? 'Animal Habitat Explorer',
    sceneType: 'animal_habitat',
    habitatType,
    climate,
    showLabels: !lowered.includes('no labels'),
    difficulty: inferDifficulty(curriculumText),
    animals: animalLibrary,
    guidingQuestions: [
      'Which animal is a predator in this habitat?',
      'What does each animal eat, and where does it find food?',
      'Which animal spends the most time in the tree canopy?',
      'How do rainforest plants help these animals survive?',
    ],
    narration:
      'Explore a rainforest habitat with animal photo cards and a simple 3D environment. Compare where each animal lives, what it eats, and how it fits into the ecosystem.',
    objective,
    topic: `${habitatType} animals and habitats`,
    ageLevel: extractAgeLevel(curriculumText),
    subject: 'biology',
    source: 'local-fallback',
    warning: reason,
  };
}

function inferTeachingMaterialConfig(curriculumText, reason, template) {
  const lowered = curriculumText.toLowerCase();
  const topic = lowered.includes('tiger') ? 'Tiger' : extractObjective(curriculumText);

  if (topic === 'Tiger') {
    return {
      templateId: template?.id ?? 'teaching_material_basic',
      templateName: template?.name ?? 'Teaching Material Viewer',
      sceneType: 'teaching_material',
      topic,
      title: 'Tiger Teaching Material',
      photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg/500px-Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg',
      modelUrl: '',
      modelHint: 'A real tiger photo shown as an interactive 3D-style cutout that students can rotate, zoom, and inspect.',
      labels: [
        { text: 'Head', x: -0.34, y: 0.32 },
        { text: 'Stripes', x: 0.1, y: 0.12 },
        { text: 'Tail', x: 0.54, y: 0.05 },
        { text: 'Paws', x: -0.18, y: -0.42 },
        { text: 'Predator', x: 0.32, y: -0.28 },
      ],
      facts: [
        'Tigers are powerful predators and mostly hunt alone.',
        'Their stripes help them blend into tall grass and forest shadows.',
        'Tigers have strong paws, sharp claws, and excellent night vision.',
        'They need large habitats with water, cover, and enough prey.',
      ],
      guidingQuestions: [],
      narration:
        'Use the real photo and the 3D-style cutout to inspect the tiger. Rotate and zoom the view, then use the labels to identify important body features.',
      objective: extractObjective(curriculumText),
      ageLevel: extractAgeLevel(curriculumText),
      subject: 'biology',
      source: 'local-fallback',
      warning: reason,
    };
  }

  return {
    templateId: template?.id ?? 'teaching_material_basic',
    templateName: template?.name ?? 'Teaching Material Viewer',
    sceneType: 'teaching_material',
    topic,
    title: `${topic} Teaching Material`,
    photoUrl: '',
    modelUrl: '',
    modelHint: 'Interactive 3D-style teaching object',
    labels: [],
    facts: ['Add a real photo and labels for this topic.'],
    guidingQuestions: [],
    narration: `Explore ${topic} with a photo, labels, and a 3D-style view.`,
    objective: extractObjective(curriculumText),
    ageLevel: extractAgeLevel(curriculumText),
    subject: 'general',
    source: 'local-fallback',
    warning: reason,
  };
}

function inferGraphConfig(curriculumText, reason, template) {
  const lowered = curriculumText.toLowerCase();
  const functionType = lowered.includes('quadratic') || lowered.includes('parabola')
    ? 'quadratic'
    : lowered.includes('sine')
      ? 'sine'
      : lowered.includes('cosine')
        ? 'cosine'
        : 'linear';

  return {
    templateId: template?.id ?? 'graph_2d',
    templateName: template?.name ?? '2D Function Graph Explorer',
    sceneType: 'graph_2d',
    allowed: true,
    matchedTemplate: template?.id ?? 'graph_2d',
    functionType,
    coefficientA: 1,
    coefficientB: 0,
    coefficientC: 0,
    xMin: -10,
    xMax: 10,
    adjustableVariables: template?.adjustableVariables,
    guidingQuestions: [
      'How does changing a affect the graph?',
      'What happens when b or c changes?',
      'Where does the graph cross the y-axis?',
    ],
    narration:
      'Use the controls to change the function and watch the graph update instantly. Compare the shape, steepness, and intercepts as each value changes.',
    objective: extractObjective(curriculumText),
    topic: 'function graphing',
    ageLevel: extractAgeLevel(curriculumText),
    subject: 'mathematics',
    source: 'local-fallback',
    warning: reason,
  };
}

export function createFallbackConfig(curriculumText, reason = '', template = null) {
  if (template?.sceneType === 'graph_2d') {
    return inferGraphConfig(curriculumText, reason, template);
  }

  if (template?.sceneType === 'teaching_material') {
    return inferTeachingMaterialConfig(curriculumText, reason, template);
  }

  if (template?.sceneType === 'animal_habitat') {
    return inferAnimalHabitatConfig(curriculumText, reason, template);
  }

  if (template?.sceneType === 'volcano') {
    return inferVolcanoConfig(curriculumText, reason, template);
  }

  const circuitType = inferCircuitType(curriculumText);
  const objective = extractObjective(curriculumText);

  return {
    templateId: template?.id ?? 'circuit_basic',
    templateName: template?.name ?? 'Basic Circuit Lab',
    sceneType: template?.sceneType ?? 'circuit',
    allowed: true,
    matchedTemplate: template?.id ?? 'circuit_basic',
    circuitType,
    numberOfBulbs: circuitType === 'series' ? 3 : 2,
    batteryVoltage: 6,
    resistancePerBulb: 4,
    adjustableVariables: template?.adjustableVariables,
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
