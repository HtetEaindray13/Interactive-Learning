import { initAnimalHabitatScene } from '../scene/AnimalHabitatScene';
import { initCircuitScene } from '../scene/CircuitScene';
import { initGraphScene } from '../scene/GraphScene';
import { initTeachingMaterialScene } from '../scene/TeachingMaterialScene';
import { initVolcanoScene } from '../scene/VolcanoScene';
import { renderControlPanel } from './ControlPanel';
import type {
  AnimalHabitatConfig,
  CircuitConfig,
  GraphConfig,
  LabConfig,
  PolicyMessageConfig,
  TeachingMaterialConfig,
  VisualMaterialConfig,
  VolcanoConfig,
} from '../scene/types';

function escapeHtml(value: string | number | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function labSubtitle(config: LabConfig): string {
  if (config.sceneType === 'policy_message') {
    const policyConfig = config as PolicyMessageConfig;
    return policyConfig.allowed
      ? `${policyConfig.subject || 'subject'} | template not built yet`
      : `${policyConfig.subject || 'subject'} | 3D disabled by policy`;
  }

  if (config.sceneType === 'graph_2d') {
    const graphConfig = config as GraphConfig;
    return `${graphConfig.subject ?? 'mathematics'} | ${graphConfig.functionType} graph | flat 2D view`;
  }

  if (config.sceneType === 'visual_material') {
    const visualConfig = config as VisualMaterialConfig;
    return `${visualConfig.subject ?? 'general'} | ${visualConfig.visualType} | source-based material`;
  }

  if (config.sceneType === 'teaching_material') {
    const materialConfig = config as TeachingMaterialConfig;
    return `${materialConfig.topic} | real photo | interactive 3D-style view`;
  }

  if (config.sceneType === 'animal_habitat') {
    const animalConfig = config as AnimalHabitatConfig;
    return `${animalConfig.habitatType} habitat | ${animalConfig.climate} climate | ${animalConfig.animals.length} animals`;
  }

  if (config.sceneType === 'volcano') {
    const volcanoConfig = config as VolcanoConfig;
    return `Eruption level ${volcanoConfig.eruptionLevel} | ${volcanoConfig.difficulty} | ${volcanoConfig.focusArea.replace('_', ' ')}`;
  }

  const circuitConfig = config as CircuitConfig;
  return `${circuitConfig.circuitType === 'series' ? 'Series' : 'Parallel'} circuit | ${circuitConfig.numberOfBulbs} bulb(s)`;
}

function initScene(container: HTMLElement, config: LabConfig) {
  if (config.sceneType === 'policy_message') {
    return {
      update: () => {},
      dispose: () => {},
    };
  }

  if (config.sceneType === 'visual_material') {
    return {
      update: () => {},
      dispose: () => {},
    };
  }

  if (config.sceneType === 'teaching_material') {
    return initTeachingMaterialScene(container, config as TeachingMaterialConfig);
  }

  if (config.sceneType === 'animal_habitat') {
    return initAnimalHabitatScene(container, config as AnimalHabitatConfig);
  }

  if (config.sceneType === 'volcano') {
    return initVolcanoScene(container, config as VolcanoConfig);
  }

  if (config.sceneType === 'graph_2d') {
    return initGraphScene(container, config as GraphConfig);
  }

  return initCircuitScene(container, config as CircuitConfig);
}

function visualToTeachingConfig(config: VisualMaterialConfig): TeachingMaterialConfig {
  return {
    templateId: config.templateId,
    templateName: `${config.topic} 3D Model`,
    sceneType: 'teaching_material',
    topic: config.topic,
    title: `${config.topic} 3D Model`,
    photoUrl: config.imageUrl,
    modelUrl: config.modelUrl,
    modelStatus: config.modelStatus,
    modelMessage: config.modelMessage,
    modelView: config.modelView,
    modelHint: 'Interactive 3D teaching view with rotation, lighting, and labels.',
    labels: config.labels,
    facts: config.facts,
    guidingQuestions: config.guidingQuestions,
    narration: config.narration,
    objective: config.objective,
    ageLevel: config.ageLevel,
    subject: config.subject,
    source: config.source,
    warning: config.warning,
  };
}

function renderVisualMaterial(config: LabConfig): string {
  if (config.sceneType !== 'visual_material') {
    return '';
  }

  const visualConfig = config as VisualMaterialConfig;
  const canUse3D = !visualConfig.restrict3D && Boolean(visualConfig.enable3D);

  return `
    <section class="visual-material">
      <div class="diagram-choice" role="group" aria-label="Choose material view">
        <button type="button" class="diagram-choice-button active" data-view-choice="2d">2D Diagram</button>
        ${canUse3D ? '<button type="button" class="diagram-choice-button" data-view-choice="3d">3D Model</button>' : ''}
      </div>
      ${visualConfig.restrict3D ? `<p class="restriction-note">${escapeHtml(visualConfig.restrict3DReason ?? '3D is restricted for this subject, so this material uses 2D images only.')}</p>` : ''}

      <div class="view-panel active" data-view-panel="2d">
        <article class="visual-hero">
        <div class="visual-image-wrap" data-topic="${escapeHtml(visualConfig.topic)}">
          ${visualConfig.imageUrl ? `
            <img
              src="${escapeHtml(visualConfig.imageUrl)}"
              alt="${escapeHtml(visualConfig.imageAlt)}"
              onerror="this.hidden=true;this.parentElement.classList.add('image-failed');"
            />
            ${visualConfig.labels
              .map(
                (label) => `
                  <span class="photo-label" style="left: ${Math.round((label.x + 1) * 50)}%; top: ${Math.round((1 - label.y) * 50)}%;">
                    ${escapeHtml(label.text)}
                  </span>`
              )
              .join('')}` : `
            <div class="source-needed">
              <strong>No verified source image found</strong>
              <span>Use the sources and video searches below to choose a real 2D image for this topic.</span>
            </div>`}
        </div>
        <div class="source-strip">
          <span>Search: ${escapeHtml(visualConfig.searchQuery)}</span>
          <span>${escapeHtml(visualConfig.visualType)}</span>
        </div>
        </article>
      </div>

      ${canUse3D ? `<div class="view-panel" data-view-panel="3d">
        <article class="model-choice-panel">
          <div>
            <h2>3D Exploration</h2>
            <p>${escapeHtml(visualConfig.modelMessage || 'Rotate, zoom, and inspect an interactive teaching view for this topic.')}</p>
          </div>
          <div class="model-status" data-status="${escapeHtml(visualConfig.modelStatus ?? 'fallback_2_5d')}">
            <strong>${visualConfig.modelStatus === 'ready' ? '3D model loaded' : 'Interactive 3D view ready'}</strong>
            <p>${visualConfig.modelUrl ? `Loading ${escapeHtml(visualConfig.modelUrl)}` : 'Use mouse or touch controls to rotate and zoom.'}</p>
          </div>
          <div class="scene-container visual-3d-container" id="visual-3d-container"></div>
        </article>
      </div>` : ''}

      <section class="visual-content-grid">
        <article class="wide-card">
          <h2>Paragraph</h2>
          <p>${escapeHtml(visualConfig.lessonParagraph ?? visualConfig.narration)}</p>
        </article>
        ${(visualConfig.formulas ?? []).length > 0 ? `
          <article class="formula-card">
            <h2>Formula</h2>
            ${(visualConfig.formulas ?? [])
              .map(
                (formula) => `
                  <div class="formula-item">
                    <strong>${escapeHtml(formula.name)}</strong>
                    <code>${escapeHtml(formula.expression)}</code>
                    <p>${escapeHtml(formula.example)}</p>
                  </div>`
              )
              .join('')}
          </article>` : ''}
        <article>
          <h2>Key Facts</h2>
          <ul>
            ${visualConfig.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}
          </ul>
        </article>
        <article>
          <h2>Vocabulary</h2>
          <dl>
            ${visualConfig.vocabulary
              .map(
                (item) => `
                  <div>
                    <dt>${escapeHtml(item.term)}</dt>
                    <dd>${escapeHtml(item.definition)}</dd>
                  </div>`
              )
              .join('')}
          </dl>
        </article>
        <article>
          <h2>Observe</h2>
          <ul>
            ${visualConfig.observePrompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join('')}
          </ul>
        </article>
        <article>
          <h2>Quiz</h2>
          <div class="quiz-list">
            ${(visualConfig.quiz ?? [])
              .map(
                (item, index) => `
                  <details class="quiz-card">
                    <summary>${index + 1}. ${escapeHtml(item.question)}</summary>
                    <ul>
                      ${item.options.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}
                    </ul>
                    <p><strong>Answer:</strong> ${escapeHtml(item.answer)}</p>
                    <p>${escapeHtml(item.explanation)}</p>
                  </details>`
              )
              .join('')}
          </div>
        </article>
        <article>
          <h2>Video Searches</h2>
          <div class="video-list">
            ${(visualConfig.videos ?? [])
              .map(
                (video) => `
                  <a class="video-card" href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">
                    <span>${escapeHtml(video.provider)}</span>
                    <strong>${escapeHtml(video.title)}</strong>
                    <small>${escapeHtml(video.description)}</small>
                  </a>`
              )
              .join('')}
          </div>
        </article>
        <article>
          <h2>Sources</h2>
          <ul class="source-list">
            ${visualConfig.sources
              .map(
                (source) => `
                  <li>
                    <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)}</a>
                  </li>`
              )
              .join('')}
          </ul>
        </article>
      </section>
    </section>
  `;
}

function renderTeachingMaterial(config: LabConfig): string {
  if (config.sceneType !== 'teaching_material') {
    return '';
  }

  const materialConfig = config as TeachingMaterialConfig;
  const statusText = materialConfig.modelStatus === 'ready'
    ? '3D model loaded'
    : materialConfig.modelStatus === 'generating'
      ? '3D model generation pending'
      : 'Interactive visual view ready';

  return `
    <section class="material-grid">
      <article class="material-photo-card">
        ${materialConfig.photoUrl ? `<img src="${escapeHtml(materialConfig.photoUrl)}" alt="${escapeHtml(materialConfig.topic)}" />` : ''}
      </article>
      <article class="material-facts">
        <h2>Key Facts</h2>
        <ul>
          ${materialConfig.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}
        </ul>
        <div class="model-status" data-status="${materialConfig.modelStatus ?? 'fallback_2_5d'}">
          <strong>${statusText}</strong>
          ${materialConfig.modelMessage ? `<p>${escapeHtml(materialConfig.modelMessage)}</p>` : ''}
        </div>
      </article>
    </section>
  `;
}

function renderPolicyMessage(config: LabConfig): string {
  if (config.sceneType !== 'policy_message') {
    return '';
  }

  const policyConfig = config as PolicyMessageConfig;
  return `
    <section class="policy-message">
      <strong>${policyConfig.allowed ? 'Template not built yet' : '3D material blocked'}</strong>
      <p>${escapeHtml(policyConfig.reason)}</p>
      <p>${escapeHtml(policyConfig.suggestion)}</p>
    </section>
  `;
}

function renderAnimalCards(config: LabConfig): string {
  if (config.sceneType !== 'animal_habitat') {
    return '';
  }

  const animalConfig = config as AnimalHabitatConfig;
  return `
    <section class="animal-cards" aria-label="Animal photo cards">
      ${animalConfig.animals
        .map(
          (animal) => `
        <article class="animal-card" data-animal-name="${animal.name}" tabindex="0">
          <img src="${escapeHtml(animal.imageUrl)}" alt="${escapeHtml(animal.name)}" loading="lazy" />
          <div>
            <h3>${escapeHtml(animal.name)}</h3>
            <p><strong>Role:</strong> ${escapeHtml(animal.role)}</p>
            <p><strong>Diet:</strong> ${escapeHtml(animal.diet)}</p>
            <p><strong>Habitat:</strong> ${escapeHtml(animal.habitat)}</p>
            <p>${escapeHtml(animal.fact)}</p>
          </div>
        </article>`
        )
        .join('')}
    </section>
  `;
}

export function renderStudentPanel(container: HTMLElement, config: LabConfig): void {
  let currentConfig = config;

  container.innerHTML = `
    <header class="app-header">
      <div>
        <a class="home-link" href="/" aria-label="Back to home">Interactive Learning</a>
        <span>AI teaching material builder</span>
      </div>
      <nav aria-label="Material modes">
        <span>2D visuals</span>
        <span>Prompt-based views</span>
      </nav>
    </header>
    <h1>${escapeHtml(config.templateName ?? 'Virtual Lab')}</h1>
    <p class="subtitle">${escapeHtml(labSubtitle(config))}</p>
    <div class="panel">
      ${config.warning ? `<p class="warning">${escapeHtml(config.warning)}</p>` : ''}
      <p class="narration">${escapeHtml(config.narration)}</p>
      ${renderPolicyMessage(config)}
      ${renderVisualMaterial(config)}
      ${renderTeachingMaterial(config)}
      ${renderAnimalCards(config)}
      ${config.sceneType === 'visual_material' || config.sceneType === 'policy_message' ? '' : '<div class="control-panel" id="control-panel"></div><div class="scene-container" id="scene-container"></div>'}
    </div>
  `;

  const sceneContainer = container.querySelector<HTMLElement>('#scene-container');
  const controlContainer = container.querySelector<HTMLElement>('#control-panel');
  const cards = Array.from(container.querySelectorAll<HTMLElement>('.animal-card'));
  const viewButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.diagram-choice-button'));
  const viewPanels = Array.from(container.querySelectorAll<HTMLElement>('.view-panel'));
  let visual3dHandle: ReturnType<typeof initTeachingMaterialScene> | null = null;

  function selectAnimalCard(animalName: string) {
    cards.forEach((card) => {
      const isSelected = card.dataset.animalName === animalName;
      card.classList.toggle('animal-card-active', isSelected);
      card.setAttribute('aria-selected', String(isSelected));
    });
  }

  const sceneHandle: { update: (nextConfig: any) => void; focusAnimal?: (animalName: string) => void; dispose: () => void } = config.sceneType === 'animal_habitat'
    ? initAnimalHabitatScene(sceneContainer!, config as AnimalHabitatConfig, selectAnimalCard)
    : sceneContainer
      ? initScene(sceneContainer, config)
      : { update: () => {}, dispose: () => {} };

  if (controlContainer) {
    renderControlPanel(controlContainer, currentConfig, (nextConfig) => {
      currentConfig = nextConfig;
      sceneHandle.update(nextConfig);
    });
  }

  function selectView(view: '2d' | '3d') {
    viewButtons.forEach((button) => {
      const isActive = button.dataset.viewChoice === view;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    viewPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.viewPanel === view);
    });

    if (config.sceneType !== 'visual_material') {
      return;
    }

    if (view === '3d') {
      const visualConfig = config as VisualMaterialConfig;
      const visual3dContainer = container.querySelector<HTMLElement>('#visual-3d-container');
      if (visual3dContainer && !visual3dHandle) {
        visual3dHandle = initTeachingMaterialScene(visual3dContainer, visualToTeachingConfig(visualConfig));
      }
      return;
    }

    visual3dHandle?.dispose();
    visual3dHandle = null;
  }

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectView(button.dataset.viewChoice === '3d' ? '3d' : '2d');
    });
  });

  cards.forEach((card) => {
    const animalName = card.dataset.animalName;
    if (!animalName) return;

    const focusAnimal = () => {
      selectAnimalCard(animalName);
      sceneHandle.focusAnimal?.(animalName);
    };

    card.addEventListener('click', focusAnimal);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        focusAnimal();
      }
    });
  });
}
