export interface BaseLabConfig {
  templateId?: string;
  templateName?: string;
  sceneType?: 'circuit' | 'volcano' | 'animal_habitat' | 'teaching_material' | 'visual_material' | 'graph_2d' | 'policy_message' | string;
  guidingQuestions: string[];
  narration: string;
  objective?: string;
  topic?: string;
  ageLevel?: string;
  subject?: string;
  source?: string;
  warning?: string;
  adjustableVariables?: Record<string, ControlDefinition>;
  allowed?: boolean;
  matchedTemplate?: string | null;
  reason?: string;
  suggestion?: string;
  restrict3D?: boolean;
  restrict3DReason?: string;
  enable3D?: boolean;
}

export type ControlDefinition =
  | {
      type: 'range' | 'number';
      label?: string;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
      default?: number;
    }
  | {
      type: 'select';
      label?: string;
      options: string[];
      default?: string;
    }
  | {
      type: 'toggle';
      label?: string;
      default?: boolean;
    };

export interface CircuitConfig extends BaseLabConfig {
  sceneType?: 'circuit' | string;
  circuitType: 'series' | 'parallel';
  numberOfBulbs: number;
  batteryVoltage: number;
  resistancePerBulb: number;
}

export interface VolcanoConfig extends BaseLabConfig {
  sceneType: 'volcano';
  eruptionLevel: number;
  showLabels: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  focusArea: 'volcano' | 'earth_layers' | 'both' | string;
}

export interface AnimalCard {
  name: string;
  role: string;
  diet: string;
  habitat: string;
  fact: string;
  imageUrl: string;
}

export interface AnimalHabitatConfig extends BaseLabConfig {
  sceneType: 'animal_habitat';
  habitatType: 'rainforest' | 'savanna' | 'wetland' | string;
  climate: 'humid' | 'dry' | 'temperate' | string;
  showLabels: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  animals: AnimalCard[];
}

export interface TeachingLabel {
  text: string;
  x: number;
  y: number;
  z?: number;
}

export interface TeachingModelView {
  quality?: 'placeholder' | 'enhanced' | 'realistic' | string;
  credit?: string;
  scale?: number;
  rotation?: [number, number, number];
  cameraPosition?: [number, number, number];
  target?: [number, number, number];
  labelPositions?: Record<string, [number, number, number]>;
}

export interface TeachingMaterialConfig extends BaseLabConfig {
  sceneType: 'teaching_material';
  topic: string;
  title: string;
  photoUrl: string;
  modelUrl?: string;
  modelStatus?: 'ready' | 'generating' | 'fallback_2_5d' | 'restricted' | 'error';
  modelMessage?: string;
  modelView?: TeachingModelView;
  modelHint: string;
  labels: TeachingLabel[];
  facts: string[];
}

export interface GraphConfig extends BaseLabConfig {
  sceneType: 'graph_2d';
  functionType: 'linear' | 'quadratic' | 'sine' | 'cosine' | string;
  coefficientA: number;
  coefficientB: number;
  coefficientC: number;
  xMin: number;
  xMax: number;
}

export interface PolicyMessageConfig extends BaseLabConfig {
  sceneType: 'policy_message';
  allowed: boolean;
  matchedTemplate: string | null;
  reason: string;
  suggestion: string;
}

export interface VisualSource {
  title: string;
  url: string;
}

export interface VisualVideo {
  title: string;
  provider: string;
  url: string;
  description: string;
}

export interface VisualModelSearch {
  title: string;
  provider: string;
  url: string;
  description: string;
}

export interface VisualQuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface VisualFormula {
  name: string;
  expression: string;
  example: string;
}

export interface VisualMaterialConfig extends BaseLabConfig {
  sceneType: 'visual_material';
  topic: string;
  title: string;
  searchQuery: string;
  visualType: 'photo' | 'diagram' | 'map' | 'timeline' | string;
  imageUrl: string;
  fallbackImageUrl?: string;
  imageAlt: string;
  labels: TeachingLabel[];
  lessonParagraph?: string;
  formulas?: VisualFormula[];
  facts: string[];
  vocabulary: Array<{ term: string; definition: string }>;
  observePrompts: string[];
  quiz?: VisualQuizQuestion[];
  videos?: VisualVideo[];
  modelUrl?: string;
  modelStatus?: 'ready' | 'generating' | 'fallback_2_5d' | 'restricted' | 'error';
  modelMessage?: string;
  modelView?: TeachingModelView;
  modelSearches?: VisualModelSearch[];
  sources: VisualSource[];
}

export type LabConfig =
  | CircuitConfig
  | VolcanoConfig
  | AnimalHabitatConfig
  | TeachingMaterialConfig
  | VisualMaterialConfig
  | GraphConfig
  | PolicyMessageConfig;

export interface SceneHandle<TConfig extends LabConfig = LabConfig> {
  update: (config: TConfig) => void;
  focusAnimal?: (animalName: string) => void;
  dispose: () => void;
}
