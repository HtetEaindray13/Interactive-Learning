import { resolveTeachingModel } from './modelGenerationService.js';

const WIKI_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';

function titleCase(value) {
  return String(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildGeneratedVisualDataUri(topic, subject, visualType = 'diagram', formulaText = '') {
  const title = titleCase(topic || 'Teaching Topic');
  const palette = {
    biology: ['#14532d', '#22c55e', '#bbf7d0'],
    history: ['#422006', '#f59e0b', '#fef3c7'],
    geography: ['#164e63', '#06b6d4', '#cffafe'],
    physics: ['#1e3a8a', '#60a5fa', '#dbeafe'],
    chemistry: ['#581c87', '#a855f7', '#f3e8ff'],
    mathematics: ['#172554', '#38bdf8', '#e0f2fe'],
    astronomy: ['#111827', '#818cf8', '#e0e7ff'],
    general: ['#1f2937', '#38bdf8', '#e0f2fe'],
  }[subject] ?? ['#1f2937', '#38bdf8', '#e0f2fe'];
  const [dark, accent, light] = palette;
  const isTimeline = visualType === 'timeline' || subject === 'history';
  const isMap = String(visualType).includes('map') || subject === 'geography';
  const isMath = subject === 'mathematics';
  const isPendulum = subject === 'physics' && /\bpendulum\b/i.test(String(topic));
  const centerShape = isTimeline
    ? `<line x1="140" y1="265" x2="820" y2="265" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
       <circle cx="220" cy="265" r="34" fill="${light}"/><circle cx="430" cy="265" r="34" fill="${light}"/><circle cx="640" cy="265" r="34" fill="${light}"/>
       <text x="220" y="273" text-anchor="middle" font-size="22" font-weight="700" fill="${dark}">1</text>
       <text x="430" y="273" text-anchor="middle" font-size="22" font-weight="700" fill="${dark}">2</text>
       <text x="640" y="273" text-anchor="middle" font-size="22" font-weight="700" fill="${dark}">3</text>`
    : isMap
      ? `<path d="M245 315 C310 210 420 238 475 150 C545 230 685 190 735 320 C655 410 455 402 245 315Z" fill="${light}" opacity="0.95"/>
         <path d="M340 310 C395 260 468 310 535 250 C582 306 640 306 688 346" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`
      : isMath
        ? `<line x1="250" y1="365" x2="710" y2="365" stroke="${light}" stroke-width="5" opacity="0.75"/>
           <line x1="310" y1="145" x2="310" y2="405" stroke="${light}" stroke-width="5" opacity="0.75"/>
           <path d="M260 340 C360 260 420 295 500 220 C570 155 630 175 700 112" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
           <rect x="560" y="250" width="118" height="118" rx="14" fill="${light}" opacity="0.9"/>
           <text x="619" y="322" text-anchor="middle" font-size="42" font-weight="800" fill="${dark}">π</text>
           <text x="480" y="425" text-anchor="middle" font-size="30" font-weight="800" fill="${light}">${escapeSvg(formulaText || 'rule → example → pattern')}</text>`
      : isPendulum
        ? `<path d="M310 390 A230 230 0 0 1 650 390" fill="none" stroke="${light}" stroke-width="5" stroke-dasharray="12 12" opacity="0.65"/>
           <line x1="480" y1="128" x2="480" y2="405" stroke="${light}" stroke-width="4" opacity="0.5"/>
           <line x1="480" y1="128" x2="610" y2="365" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
           <circle cx="480" cy="128" r="20" fill="${light}"/>
           <circle cx="610" cy="365" r="58" fill="${accent}" stroke="${light}" stroke-width="8"/>
           <path d="M505 186 A88 88 0 0 1 552 205" fill="none" stroke="${light}" stroke-width="5"/>
           <text x="512" y="174" font-size="24" font-weight="800" fill="${light}">angle</text>
           <text x="625" y="450" text-anchor="middle" font-size="26" font-weight="800" fill="${light}">bob</text>
           <text x="560" y="255" font-size="26" font-weight="800" fill="${light}">string</text>`
      : `<circle cx="480" cy="280" r="145" fill="${light}" opacity="0.95"/>
         <circle cx="480" cy="280" r="82" fill="${accent}" opacity="0.95"/>
         <path d="M480 122 L535 225 L650 240 L568 320 L588 434 L480 380 L372 434 L392 320 L310 240 L425 225Z" fill="${dark}" opacity="0.16"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeSvg(title)} generated teaching visual">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${dark}"/>
        <stop offset="1" stop-color="#020617"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <rect width="960" height="540" fill="url(#bg)"/>
    <rect x="44" y="44" width="872" height="452" rx="28" fill="#0f172a" stroke="${accent}" stroke-width="3" opacity="0.84"/>
    <g filter="url(#shadow)">${centerShape}</g>
    <text x="480" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#f8fafc">${escapeSvg(title)}</text>
    <text x="480" y="455" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="${light}">${escapeSvg(titleCase(subject || 'visual'))} ${escapeSvg(visualType || 'diagram')}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function ensureVisualImage(config) {
  return {
    ...config,
    imageUrl: config.imageUrl || '',
    fallbackImageUrl: '',
  };
}

function buildLessonParagraph(topic, subject, ageLevel, facts = []) {
  const factText = facts[0] ? ` ${facts[0]}` : '';
  return `${topic} is part of ${subject || 'classroom'} learning for ${ageLevel}. Students should begin by observing the visual, naming the most important parts, and connecting each label to the main idea.${factText}`;
}

function buildQuiz(topic, subject, facts = []) {
  const firstFact = facts[0] ?? `${topic} is the main topic of this lesson.`;
  return [
    {
      question: `What is the main topic of this material?`,
      options: [topic, subject || 'General learning', 'The video search only'],
      answer: topic,
      explanation: `The visual, facts, labels, and vocabulary all focus on ${topic}.`,
    },
    {
      question: `Which learning action should students do first?`,
      options: ['Observe the visual carefully', 'Skip the labels', 'Ignore the facts'],
      answer: 'Observe the visual carefully',
      explanation: 'The material is designed to start from visual observation before explanation.',
    },
    {
      question: `Which statement best matches this lesson?`,
      options: [firstFact, 'The topic is unrelated to the subject.', 'There are no important vocabulary words.'],
      answer: firstFact,
      explanation: 'This answer comes from the key facts generated for the topic.',
    },
  ];
}

function mathProfile(topic) {
  const text = topic.toLowerCase();
  if (/\b(fraction|fractions)\b/.test(text)) {
    return {
      topic: 'Fractions',
      formulaName: 'Fraction of a whole',
      expression: 'part / whole',
      example: '3/4 means 3 equal parts out of 4.',
      facts: [
        'A fraction shows how many equal parts of a whole are being used.',
        'The numerator tells how many parts are selected.',
        'The denominator tells how many equal parts make the whole.',
        'Equivalent fractions name the same amount using different numbers.',
      ],
      vocabulary: [
        { term: 'Numerator', definition: 'The top number in a fraction; it counts selected parts.' },
        { term: 'Denominator', definition: 'The bottom number in a fraction; it counts equal parts in the whole.' },
        { term: 'Equivalent fractions', definition: 'Fractions that represent the same value.' },
      ],
      quiz: [
        {
          question: 'In the fraction 3/4, what does 3 represent?',
          options: ['Selected parts', 'Total equal parts', 'The whole number'],
          answer: 'Selected parts',
          explanation: 'The numerator, 3, counts the selected parts.',
        },
        {
          question: 'Which fraction is equivalent to 1/2?',
          options: ['2/4', '1/3', '3/5'],
          answer: '2/4',
          explanation: '2/4 and 1/2 both represent half of a whole.',
        },
      ],
    };
  }

  if (/\b(angle|angles|geometry|shape|triangle|polygon)\b/.test(text)) {
    return {
      topic: text.includes('angle') ? 'Angles' : 'Geometry',
      formulaName: 'Triangle angle sum',
      expression: 'a + b + c = 180°',
      example: 'A triangle with angles 60°, 60°, and 60° totals 180°.',
      facts: [
        'Geometry studies shapes, sizes, positions, and measurements.',
        'An angle measures how much two rays turn from a shared endpoint.',
        'Angles are measured in degrees.',
        'The three inside angles of any triangle add to 180 degrees.',
      ],
      vocabulary: [
        { term: 'Angle', definition: 'A measure of turn between two rays.' },
        { term: 'Degree', definition: 'A unit used to measure angles.' },
        { term: 'Vertex', definition: 'The point where two sides or rays meet.' },
      ],
      quiz: [
        {
          question: 'What is the sum of the inside angles of a triangle?',
          options: ['180°', '90°', '360°'],
          answer: '180°',
          explanation: 'Every triangle has interior angles that add to 180°.',
        },
        {
          question: 'What tool is often used to measure angles?',
          options: ['Protractor', 'Thermometer', 'Balance scale'],
          answer: 'Protractor',
          explanation: 'A protractor measures angles in degrees.',
        },
      ],
    };
  }

  if (/\b(area|rectangle|square)\b/.test(text)) {
    return {
      topic: 'Area',
      formulaName: 'Rectangle area',
      expression: 'A = l × w',
      example: 'A rectangle 6 units long and 4 units wide has area 24 square units.',
      facts: [
        'Area measures how much flat surface a shape covers.',
        'Area is counted in square units.',
        'A rectangle’s area is length multiplied by width.',
        'Changing either length or width changes the area.',
      ],
      vocabulary: [
        { term: 'Area', definition: 'The amount of flat space inside a shape.' },
        { term: 'Square unit', definition: 'A unit for measuring area.' },
        { term: 'Length', definition: 'How long a shape is in one direction.' },
      ],
      quiz: [
        {
          question: 'What is the area of a rectangle with length 5 and width 3?',
          options: ['15 square units', '8 square units', '10 square units'],
          answer: '15 square units',
          explanation: 'Use A = l × w, so 5 × 3 = 15.',
        },
      ],
    };
  }

  if (/\b(volume|cube|cuboid|rectangular prism)\b/.test(text)) {
    return {
      topic: 'Volume',
      formulaName: 'Rectangular prism volume',
      expression: 'V = l × w × h',
      example: 'A box 3 by 4 by 5 has volume 60 cubic units.',
      facts: [
        'Volume measures how much space a 3D object takes up.',
        'Volume is counted in cubic units.',
        'A rectangular prism’s volume is length times width times height.',
        'Changing the height changes the number of layers in the object.',
      ],
      vocabulary: [
        { term: 'Volume', definition: 'The space inside a 3D object.' },
        { term: 'Cubic unit', definition: 'A unit cube used to measure volume.' },
        { term: 'Height', definition: 'How tall an object is.' },
      ],
      quiz: [
        {
          question: 'Which formula finds the volume of a rectangular prism?',
          options: ['V = l × w × h', 'A = l × w', 'P = 2l + 2w'],
          answer: 'V = l × w × h',
          explanation: 'Volume needs three dimensions: length, width, and height.',
        },
      ],
    };
  }

  if (/\b(ratio|proportion)\b/.test(text)) {
    return {
      topic: 'Ratios',
      formulaName: 'Ratio',
      expression: 'a : b',
      example: 'A ratio of 2:3 compares 2 parts to 3 parts.',
      facts: [
        'A ratio compares two quantities.',
        'Ratios can be written with a colon, words, or as a fraction.',
        'Equivalent ratios describe the same comparison.',
        'Ratios help compare recipes, maps, groups, and patterns.',
      ],
      vocabulary: [
        { term: 'Ratio', definition: 'A comparison of two quantities.' },
        { term: 'Equivalent ratio', definition: 'A ratio that names the same comparison.' },
        { term: 'Proportion', definition: 'An equation showing two ratios are equal.' },
      ],
      quiz: [
        {
          question: 'Which ratio is equivalent to 2:3?',
          options: ['4:6', '3:2', '2:5'],
          answer: '4:6',
          explanation: 'Multiplying both parts of 2:3 by 2 gives 4:6.',
        },
      ],
    };
  }

  if (/\b(probability|chance|likely|unlikely)\b/.test(text)) {
    return {
      topic: 'Probability',
      formulaName: 'Probability',
      expression: 'P(event) = favorable / total',
      example: 'If 2 of 6 spinner sections are blue, P(blue) = 2/6.',
      facts: [
        'Probability measures how likely an event is to happen.',
        'A probability of 0 means impossible, and 1 means certain.',
        'Probability can be written as a fraction, decimal, or percent.',
        'Theoretical probability compares favorable outcomes to total outcomes.',
      ],
      vocabulary: [
        { term: 'Event', definition: 'An outcome or group of outcomes.' },
        { term: 'Outcome', definition: 'A possible result.' },
        { term: 'Certain', definition: 'Something that must happen.' },
      ],
      quiz: [
        {
          question: 'If 1 side of a 6-sided die is a 4, what is P(rolling a 4)?',
          options: ['1/6', '4/6', '1/4'],
          answer: '1/6',
          explanation: 'There is 1 favorable outcome out of 6 total outcomes.',
        },
      ],
    };
  }

  if (/\b(equation|algebra|variable|solve)\b/.test(text)) {
    return {
      topic: 'Algebra Equations',
      formulaName: 'Equation balance',
      expression: 'x + 3 = 8',
      example: 'If x + 3 = 8, then x = 5.',
      facts: [
        'An equation says two expressions are equal.',
        'A variable is a symbol that stands for an unknown value.',
        'Solving an equation means finding the value that makes it true.',
        'Whatever you do to one side of an equation, do to the other side too.',
      ],
      vocabulary: [
        { term: 'Variable', definition: 'A letter or symbol for an unknown value.' },
        { term: 'Equation', definition: 'A math sentence with an equals sign.' },
        { term: 'Solution', definition: 'A value that makes an equation true.' },
      ],
      quiz: [
        {
          question: 'If x + 3 = 8, what is x?',
          options: ['5', '11', '3'],
          answer: '5',
          explanation: 'Subtract 3 from both sides: x = 5.',
        },
      ],
    };
  }

  return {
    topic: titleCase(topic || 'Mathematics'),
    formulaName: 'Math rule',
    expression: 'rule + example = understanding',
    example: 'Use a rule, test an example, then explain the pattern.',
    facts: [
      `${titleCase(topic)} uses rules and patterns to solve problems.`,
      'Mathematics becomes clearer when students connect symbols to examples.',
      'A worked example helps show each step in the reasoning.',
      'Checking an answer helps confirm that the rule was used correctly.',
    ],
    vocabulary: [
      { term: 'Rule', definition: 'A math idea that tells how numbers or shapes behave.' },
      { term: 'Example', definition: 'A specific problem used to show the rule.' },
      { term: 'Pattern', definition: 'Something that repeats or follows a predictable structure.' },
    ],
    quiz: [
      {
        question: 'What should students connect a formula or rule to?',
        options: ['A worked example', 'Random guessing', 'Unrelated facts'],
        answer: 'A worked example',
        explanation: 'Examples help students understand what the symbols mean.',
      },
    ],
  };
}

function buildMathMaterial(topic, ageLevel, sourceReason, options = {}) {
  const profile = mathProfile(topic);
  const formulas = [
    {
      name: profile.formulaName,
      expression: profile.expression,
      example: profile.example,
    },
  ];

  return attachVisualModelState({
    templateId: 'visual_material_builder',
    templateName: 'AI Teaching Material Builder',
    sceneType: 'visual_material',
    topic: profile.topic,
    title: `${profile.topic} Teaching Material`,
    searchQuery: topic,
    visualType: 'diagram',
    imageUrl: '',
    imageAlt: `${profile.topic} formula and visual diagram`,
    labels: defaultLabels('mathematics'),
    formulas,
    facts: profile.facts,
    vocabulary: profile.vocabulary,
    observePrompts: [
      `Where do you see the formula ${profile.expression}?`,
      `Which part of the example shows the rule?`,
      `How could you make a new problem using the same idea?`,
    ],
    quiz: profile.quiz,
    videos: buildVideoSearches(profile.topic, 'mathematics', ageLevel),
    sources: [],
    guidingQuestions: [],
    lessonParagraph: `${profile.topic} is a mathematics topic for ${ageLevel}. Students should connect the formula ${profile.expression} to the worked example: ${profile.example} Then they can explain the rule in words and try a similar problem.`,
    narration: `Use the formula, visual diagram, facts, and quiz to teach ${profile.topic}.`,
    objective: `Create focused mathematics teaching material about ${profile.topic}.`,
    ageLevel,
    subject: 'mathematics',
    source: 'local-math-builder',
    warning: sourceReason,
  }, options);
}

const TOPIC_LIBRARY = {
  tiger: {
    topic: 'Tiger',
    subject: 'biology',
    visualType: 'photo',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg/500px-Bengal_tiger_%28Panthera_tigris_tigris%29_female_3_crop.jpg',
    imageAlt: 'A Bengal tiger walking through grass.',
    facts: [
      'Tigers are large mammals and powerful carnivores.',
      'Their stripes help them blend into grass, forest shadows, and tall plants.',
      'Tigers usually hunt alone and need large habitats with enough prey.',
      'They have strong paws, sharp claws, and excellent hearing and night vision.',
    ],
    vocabulary: [
      { term: 'Carnivore', definition: 'An animal that eats mostly meat.' },
      { term: 'Camouflage', definition: 'Colors or patterns that help a living thing hide.' },
      { term: 'Habitat', definition: 'The natural place where a plant or animal lives.' },
    ],
    labels: [
      { text: 'Head', x: -0.72, y: 0.2 },
      { text: 'Stripes', x: 0.02, y: 0.2 },
      { text: 'Tail', x: 0.72, y: 0.25 },
      { text: 'Paws', x: -0.35, y: -0.62 },
      { text: 'Body', x: 0.25, y: -0.08 },
    ],
  },
  volcano: {
    topic: 'Volcano',
    subject: 'geography',
    visualType: 'diagram',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Volcano_scheme.svg',
    imageAlt: 'A labeled diagram showing the main parts of a volcano.',
    facts: [
      'A volcano is an opening in Earth where magma, gas, and ash can reach the surface.',
      'Magma is molten rock under the ground; lava is molten rock after it erupts.',
      'Volcanoes often form near tectonic plate boundaries.',
      'Eruptions can build mountains, create new land, and affect nearby communities.',
    ],
    vocabulary: [
      { term: 'Magma', definition: 'Molten rock below Earth’s surface.' },
      { term: 'Lava', definition: 'Molten rock that reaches Earth’s surface.' },
      { term: 'Crater', definition: 'The bowl-shaped opening near the top of a volcano.' },
    ],
    labels: [
      { text: 'Crater', x: 0.08, y: 0.64 },
      { text: 'Ash cloud', x: -0.18, y: 0.82 },
      { text: 'Lava flow', x: 0.45, y: 0.18 },
      { text: 'Magma chamber', x: 0.1, y: -0.68 },
    ],
  },
  flower: {
    topic: 'Flower',
    subject: 'biology',
    visualType: 'diagram',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Mature_flower_diagram.svg',
    imageAlt: 'A diagram of the main parts of a flower.',
    facts: [
      'Flowers are reproductive structures found in many plants.',
      'Petals can attract pollinators such as bees, butterflies, and birds.',
      'Pollen is moved from one flower part to another during pollination.',
      'After pollination, some flowers can form seeds and fruit.',
    ],
    vocabulary: [
      { term: 'Petal', definition: 'A colorful flower part that can attract pollinators.' },
      { term: 'Pollen', definition: 'A fine powder involved in plant reproduction.' },
      { term: 'Pollination', definition: 'The movement of pollen that helps plants make seeds.' },
    ],
    labels: [
      { text: 'Petal', x: -0.45, y: 0.46 },
      { text: 'Stamen', x: 0.26, y: 0.15 },
      { text: 'Pistil', x: 0.02, y: 0.38 },
      { text: 'Sepal', x: -0.22, y: -0.18 },
    ],
  },
  'human digestive system': {
    topic: 'Human Digestive System',
    subject: 'biology',
    visualType: 'diagram',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Digestive_system_diagram_en.svg',
    imageAlt: 'A labeled diagram of the human digestive system.',
    facts: [
      'The digestive system breaks food into nutrients the body can use.',
      'Digestion begins in the mouth, where teeth and saliva start breaking down food.',
      'The stomach mixes food with acid and enzymes.',
      'The small intestine absorbs many nutrients into the bloodstream.',
    ],
    vocabulary: [
      { term: 'Digestion', definition: 'The process of breaking food into smaller useful parts.' },
      { term: 'Stomach', definition: 'An organ that mixes food with digestive juices.' },
      { term: 'Small intestine', definition: 'A long organ where many nutrients are absorbed.' },
    ],
    labels: [
      { text: 'Mouth', x: -0.1, y: 0.72 },
      { text: 'Esophagus', x: 0.08, y: 0.4 },
      { text: 'Stomach', x: 0.28, y: 0.1 },
      { text: 'Small intestine', x: 0.08, y: -0.34 },
      { text: 'Large intestine', x: -0.18, y: -0.18 },
    ],
  },
  'world war i': {
    topic: 'World War I',
    subject: 'history',
    visualType: 'timeline',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/WWImontage.jpg',
    imageAlt: 'A historical montage showing scenes from World War I.',
    facts: [
      'World War I lasted from 1914 to 1918.',
      'The war involved many countries and alliances across Europe and beyond.',
      'Militarism, alliances, imperialism, and nationalism are common causes studied in class.',
      'The assassination of Archduke Franz Ferdinand helped trigger the conflict.',
    ],
    vocabulary: [
      { term: 'Alliance', definition: 'An agreement between countries to support each other.' },
      { term: 'Imperialism', definition: 'A policy where powerful countries seek control or influence over other places.' },
      { term: 'Nationalism', definition: 'Strong loyalty to one nation, sometimes leading to rivalry.' },
    ],
    labels: [
      { text: '1914 start', x: -0.58, y: 0.35 },
      { text: 'Alliances', x: 0.05, y: 0.22 },
      { text: 'Trench warfare', x: 0.45, y: -0.05 },
      { text: '1918 end', x: 0.58, y: -0.4 },
    ],
  },
  'solar system': {
    topic: 'Solar System',
    subject: 'astronomy',
    visualType: 'diagram',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Planets2013.svg',
    imageAlt: 'A diagram showing the planets of the Solar System.',
    facts: [
      'The Solar System includes the Sun, planets, moons, asteroids, comets, and dwarf planets.',
      'Planets orbit the Sun because of gravity.',
      'The inner planets are rocky, while the outer planets are mostly gas or ice giants.',
      'Earth is the only planet known to support life.',
    ],
    vocabulary: [
      { term: 'Orbit', definition: 'The path an object follows around another object in space.' },
      { term: 'Gravity', definition: 'A force that pulls objects toward each other.' },
      { term: 'Planet', definition: 'A large object that orbits a star.' },
    ],
    labels: [
      { text: 'Sun', x: -0.82, y: 0.02 },
      { text: 'Inner planets', x: -0.35, y: 0.35 },
      { text: 'Gas giants', x: 0.38, y: 0.34 },
      { text: 'Orbit order', x: 0.15, y: -0.42 },
    ],
  },
  pendulum: {
    topic: 'Pendulum',
    subject: 'physics',
    visualType: 'diagram',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Simple_pendulum.svg',
    imageAlt: 'A labeled diagram of a simple pendulum.',
    facts: [
      'A pendulum is a weight suspended from a pivot so it can swing back and forth.',
      'The bob moves along an arc because gravity pulls it downward while the string constrains its path.',
      'A longer pendulum usually has a longer period, so it swings more slowly.',
      'For small angles, the period depends mainly on length and gravity, not on the mass of the bob.',
    ],
    vocabulary: [
      { term: 'Pivot', definition: 'The fixed point where the pendulum is attached.' },
      { term: 'Bob', definition: 'The hanging mass at the end of the pendulum.' },
      { term: 'Period', definition: 'The time for one complete back-and-forth swing.' },
    ],
    labels: [
      { text: 'Pivot', x: 0, y: 0.74 },
      { text: 'String', x: 0.18, y: 0.28 },
      { text: 'Bob', x: 0.48, y: -0.42 },
      { text: 'Arc', x: -0.34, y: -0.45 },
      { text: 'Angle', x: 0.22, y: 0.54 },
    ],
  },
  'electric circuit': {
    topic: 'Electric Circuit',
    subject: 'physics',
    visualType: 'diagram',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Simple_electric_circuit.svg',
    imageAlt: 'A simple electric circuit diagram.',
    facts: [
      'An electric circuit is a closed path that lets electric current flow.',
      'A battery provides energy that pushes charges through the circuit.',
      'A bulb changes electrical energy into light and heat.',
      'If the circuit path is broken, current cannot flow and the bulb turns off.',
    ],
    vocabulary: [
      { term: 'Current', definition: 'The flow of electric charge.' },
      { term: 'Battery', definition: 'A device that stores chemical energy and provides electrical energy.' },
      { term: 'Closed circuit', definition: 'A complete path where current can flow.' },
    ],
    labels: [
      { text: 'Battery', x: -0.54, y: 0.4 },
      { text: 'Wire', x: 0.1, y: 0.58 },
      { text: 'Bulb', x: 0.55, y: 0.05 },
      { text: 'Closed path', x: -0.05, y: -0.44 },
    ],
  },
};

function extractAgeLevel(text) {
  const gradeMatch = text.match(/\b(?:grade|year)\s*(\d{1,2})\b/i);
  if (gradeMatch) return `Grade ${gradeMatch[1]}`;
  return 'General classroom';
}

function normalizeTopic(text) {
  const cleaned = text
    .toLowerCase()
    .replace(/\b(?:2d|3d|two dimensional|three dimensional|simulation|simulate|interactive|rotate|rotation|model|virtual|exploration|view)\b/g, ' ')
    .replace(/\b(explain|teach|show|about|for|grade|year|students?|kids?|lesson|material|photo|diagram)\b/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const known = Object.keys(TOPIC_LIBRARY).find((topic) => cleaned.includes(topic));
  if (known) return known;
  if (/\b(world war i|world war 1|wwi|first world war)\b/.test(cleaned)) return 'world war i';
  if (/\b(digestive system|digestion)\b/.test(cleaned)) return 'human digestive system';
  return cleaned.split(/\s+/).slice(0, 4).join(' ') || 'science';
}

function inferSubject(topic, text) {
  const searchText = `${topic} ${text}`.toLowerCase();
  if (/\b(history|war|ancient|king|queen|empire|civilization)\b/.test(searchText)) return 'history';
  if (/\b(map|country|river|mountain|volcano|earth|climate|geography)\b/.test(searchText)) return 'geography';
  if (/\b(force|energy|circuit|magnet|light|motion|physics)\b/.test(searchText)) return 'physics';
  if (/\b(atom|molecule|chemical|water|acid|chemistry)\b/.test(searchText)) return 'chemistry';
  if (/\b(math|mathematics|fractions?|decimal|percent|geometry|shape|angle|area|volume|algebra|equation|ratio|probability|multiply|division|graph|slope|linear|quadratic)\b/.test(searchText)) return 'mathematics';
  if (/\b(planet|moon|sun|solar|space|astronomy)\b/.test(searchText)) return 'astronomy';
  if (/\b(animal|plant|flower|cell|heart|body|biology|tiger)\b/.test(searchText)) return 'biology';
  return 'general';
}

function buildVideoSearches(topic, subject, ageLevel) {
  const query = `${topic} ${ageLevel} educational video`;
  const encodedQuery = encodeURIComponent(query);
  const videos = [
    {
      title: `${topic} classroom video search`,
      provider: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      description: `Find teacher-reviewed videos about ${topic}. Open and choose a video that matches ${ageLevel}.`,
    },
    {
      title: `${topic} lesson video search`,
      provider: 'Khan Academy',
      url: `https://www.khanacademy.org/search?page_search_query=${encodedQuery}`,
      description: `Search Khan Academy for structured lesson videos and explanations related to ${topic}.`,
    },
  ];

  if (subject === 'biology' || subject === 'geography' || subject === 'astronomy') {
    videos.push({
      title: `${topic} real-world video search`,
      provider: 'National Geographic',
      url: `https://www.nationalgeographic.com/search?q=${encodedQuery}`,
      description: `Look for real-world footage, nature clips, maps, or science explainers about ${topic}.`,
    });
  }

  return videos;
}

function buildModelSearches(topic) {
  const query = encodeURIComponent(`${topic} 3D model glb gltf free`);
  const codeQuery = encodeURIComponent(`${topic} Three.js 3D model code`);
  return [
    {
      title: `${topic} Three.js code examples`,
      provider: 'FreeFrontend',
      url: 'https://freefrontend.com/three-js/',
      description: 'Start here for curated Three.js snippets, effects, demos, and code patterns you can adapt.',
    },
    {
      title: `${topic} creative Three.js demos`,
      provider: 'Codrops',
      url: 'https://tympanus.net/codrops/hub/tag/three-js/',
      description: 'Look for high-quality WebGL and Three.js interaction patterns before writing custom code.',
    },
    {
      title: `${topic} official Three.js examples`,
      provider: 'Three.js',
      url: 'https://threejs.org/examples/',
      description: 'Use official examples for loaders, lighting, materials, controls, WebGPU, and standard scene setup.',
    },
    {
      title: `${topic} editable Three.js sandbox`,
      provider: 'CodeSandbox',
      url: `https://codesandbox.io/search?query=${codeQuery}`,
      description: 'Search editable Three.js and React Three Fiber examples that can be forked and adapted quickly.',
    },
    {
      title: `${topic} cloneable 3D website ideas`,
      provider: 'Webflow',
      url: 'https://webflow.com/made-in-webflow/threejs?cloneable=true',
      description: 'Study cloneable Three.js website structures and interaction patterns for polished presentation.',
    },
    {
      title: `${topic} 3D website inspiration`,
      provider: 'One Page Love',
      url: 'https://onepagelove.com/tech/three-js',
      description: 'Review production-style Three.js pages for visual direction and teaching-material layout ideas.',
    },
    {
      title: `${topic} GLB model search`,
      provider: 'Sketchfab',
      url: `https://sketchfab.com/search?features=downloadable&q=${query}&type=models`,
      description: 'If code templates are not enough, search downloadable 3D models. Check license before using in class materials.',
    },
    {
      title: `${topic} free model search`,
      provider: 'Poly Haven',
      url: `https://polyhaven.com/search?q=${query}`,
      description: 'Look for public-domain or classroom-safe 3D assets.',
    },
    {
      title: `${topic} game/education model search`,
      provider: 'Kenney',
      url: `https://kenney.nl/assets?q=${query}`,
      description: 'Search simple free assets that can be converted or used as placeholders.',
    },
  ];
}

function attachVisualModelState(config, options = {}) {
  const visualConfig = {
    ...ensureVisualImage(config),
    enable3D: Boolean(options.enable3D),
    lessonParagraph: config.lessonParagraph ?? buildLessonParagraph(config.topic, config.subject, config.ageLevel, config.facts),
    quiz: config.quiz ?? buildQuiz(config.topic, config.subject, config.facts),
  };

  if (options.restrict3D) {
    return {
      ...visualConfig,
      restrict3D: true,
      enable3D: false,
      restrict3DReason: options.restrict3DReason ?? '3D is restricted for this subject.',
      modelUrl: '',
      modelStatus: 'restricted',
      modelMessage: options.restrict3DReason ?? '3D is restricted for this subject.',
      modelSearches: [],
      subject: options.subject ?? visualConfig.subject,
      warning: options.warning ?? visualConfig.warning,
    };
  }

  if (!visualConfig.enable3D) {
    return {
      ...visualConfig,
      modelUrl: '',
      modelStatus: undefined,
      modelMessage: '',
      modelSearches: [],
      warning: options.warning ?? visualConfig.warning,
    };
  }

  const modelState = resolveTeachingModel(visualConfig.topic);
  return {
    ...visualConfig,
    ...modelState,
    warning: options.warning ?? visualConfig.warning,
    modelSearches: buildModelSearches(visualConfig.topic),
  };
}

function defaultLabels(subject) {
  if (subject === 'history') {
    return [
      { text: 'Person or event', x: -0.35, y: 0.2 },
      { text: 'Place', x: 0.3, y: 0.18 },
      { text: 'Time period', x: 0, y: -0.42 },
    ];
  }

  if (subject === 'geography') {
    return [
      { text: 'Landform', x: -0.35, y: 0.25 },
      { text: 'Location', x: 0.32, y: 0.14 },
      { text: 'Environment', x: 0, y: -0.42 },
    ];
  }

  if (subject === 'mathematics') {
    return [
      { text: 'Rule', x: -0.35, y: 0.25 },
      { text: 'Example', x: 0.34, y: 0.14 },
      { text: 'Pattern', x: 0, y: -0.42 },
    ];
  }

  return [
    { text: 'Main part', x: -0.32, y: 0.25 },
    { text: 'Important feature', x: 0.34, y: 0.12 },
    { text: 'Observe here', x: 0, y: -0.42 },
  ];
}

function buildGenericMaterial(topic, subject, ageLevel, sourceReason, options = {}) {
  const titleTopic = topic
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return attachVisualModelState({
    templateId: 'visual_material_builder',
    templateName: 'AI Teaching Material Builder',
    sceneType: 'visual_material',
    topic: titleTopic,
    title: `${titleTopic} Teaching Material`,
    searchQuery: topic,
    visualType: subject === 'history' ? 'timeline' : subject === 'geography' ? 'map or photo' : subject === 'mathematics' ? 'diagram' : 'photo or diagram',
    imageUrl: '',
    imageAlt: `${titleTopic} teaching visual`,
    labels: defaultLabels(subject),
    facts: [
      `${titleTopic} is the main topic for this teaching material.`,
      `The system could not find a prepared local source, so the teacher should review and add a trusted image.`,
      `Use the labels to guide students toward the most important visible features.`,
      `Ask students to describe what they notice before reading the explanation.`,
    ],
    vocabulary: [
      { term: 'Topic', definition: `The subject students are learning about: ${titleTopic}.` },
      { term: 'Evidence', definition: 'Information from a trusted source that supports the lesson.' },
      { term: 'Observation', definition: 'Something students can see, notice, or describe.' },
    ],
    observePrompts: [
      `What do you notice first about ${titleTopic}?`,
      'Which label points to the most important feature?',
      'What question would you ask before reading more?',
    ],
    videos: buildVideoSearches(titleTopic, subject, ageLevel),
    sources: [],
    guidingQuestions: [],
    narration: `Use this source-based page to introduce ${titleTopic}. Start with the visual, then connect the labels, facts, and vocabulary to the lesson goal.`,
    objective: `Create a realistic visual teaching material page about ${titleTopic}.`,
    ageLevel,
    subject,
    source: 'local-generic',
    warning: sourceReason,
  }, options);
}

async function fetchWikipedia(topic) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${WIKI_SUMMARY_BASE}/${encodeURIComponent(topic)}`, {
      headers: { 'User-Agent': 'InteractiveLearningTeachingBuilder/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildFromBase(base, curriculumText, sourceReason = '', options = {}) {
  const ageLevel = extractAgeLevel(curriculumText);
  const topic = base.topic;
  return attachVisualModelState({
    templateId: 'visual_material_builder',
    templateName: 'AI Teaching Material Builder',
    sceneType: 'visual_material',
    topic,
    title: `${topic} Teaching Material`,
    searchQuery: curriculumText,
    visualType: base.visualType,
    imageUrl: base.imageUrl,
    imageAlt: base.imageAlt,
    labels: base.labels,
    facts: base.facts,
    vocabulary: base.vocabulary,
    observePrompts: [
      `What do you notice first in this ${base.visualType}?`,
      `Which label helps explain ${topic} most clearly?`,
      `How would you explain ${topic} to a classmate?`,
    ],
    videos: buildVideoSearches(topic, base.subject, ageLevel),
    sources: [
      { title: 'Wikimedia Commons visual source', url: base.imageUrl },
      { title: `${topic} reference search`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replaceAll(' ', '_'))}` },
    ],
    guidingQuestions: [],
    narration: `Use the realistic visual, labels, facts, and vocabulary to teach ${topic} at ${ageLevel} level.`,
    objective: `Create a realistic source-based teaching material page about ${topic}.`,
    ageLevel,
    subject: base.subject,
    source: 'local-library',
    warning: sourceReason,
  }, options);
}

export async function createVisualMaterialConfig(curriculumText, template, options = {}) {
  const rawTopic = normalizeTopic(curriculumText);
  const libraryBase = TOPIC_LIBRARY[rawTopic];

  if (libraryBase) {
    return {
      ...buildFromBase(libraryBase, curriculumText, '', options),
      templateId: template?.id ?? 'visual_material_builder',
      templateName: template?.name ?? 'AI Teaching Material Builder',
    };
  }

  const subject = options.subject ?? inferSubject(rawTopic, curriculumText);
  if (subject === 'mathematics') {
    return {
      ...buildMathMaterial(
        rawTopic,
        extractAgeLevel(curriculumText),
        options.warning ?? '',
        options
      ),
      templateId: template?.id ?? 'visual_material_builder',
      templateName: template?.name ?? 'AI Teaching Material Builder',
    };
  }

  const wiki = await fetchWikipedia(rawTopic);
  if (wiki) {
    const topic = wiki.title ?? rawTopic;
    const facts = [
      wiki.extract,
      `${topic} is connected to ${subject} learning.`,
      'Use the source link to review more details before teaching.',
    ].filter(Boolean);
    return attachVisualModelState({
      templateId: template?.id ?? 'visual_material_builder',
      templateName: template?.name ?? 'AI Teaching Material Builder',
      sceneType: 'visual_material',
      topic,
      title: `${topic} Teaching Material`,
      searchQuery: curriculumText,
      visualType: subject === 'history' ? 'timeline' : subject === 'geography' ? 'map or photo' : subject === 'mathematics' ? 'diagram' : 'photo or diagram',
      imageUrl: wiki.originalimage?.source ?? wiki.thumbnail?.source ?? '',
      imageAlt: wiki.description ?? `${topic} image`,
      labels: defaultLabels(subject),
      facts: facts.slice(0, 4),
      vocabulary: [
        { term: 'Topic', definition: `The subject students are learning about: ${topic}.` },
        { term: 'Evidence', definition: 'Information from a trusted source that supports the lesson.' },
        { term: 'Observation', definition: 'Something students can see, notice, or describe.' },
      ],
      observePrompts: [
        `What do you notice first about ${topic}?`,
        'Which label points to the most important feature?',
        'What question would you ask before reading more?',
      ],
      videos: buildVideoSearches(topic, subject, extractAgeLevel(curriculumText)),
      sources: [{ title: wiki.content_urls?.desktop?.page ? 'Wikipedia article' : 'Wikipedia summary', url: wiki.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}` }],
      guidingQuestions: [],
      narration: `Use this source-based page to introduce ${topic}. Start with the visual, then connect the labels, facts, and vocabulary to the lesson goal.`,
      objective: `Create a realistic visual teaching material page about ${topic}.`,
      ageLevel: extractAgeLevel(curriculumText),
      subject,
      source: 'wikipedia-summary',
    }, options);
  }

  return {
    ...buildGenericMaterial(
      rawTopic,
      subject,
      extractAgeLevel(curriculumText),
      'Online source search is unavailable, so this response used a local generic teaching-material structure.',
      options
    ),
    templateId: template?.id ?? 'visual_material_builder',
    templateName: template?.name ?? 'AI Teaching Material Builder',
  };
}
