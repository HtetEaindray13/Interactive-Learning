import { configureLab, getTemplates, type LabTemplate } from '../api';
import type { LabConfig } from '../scene/types';

function renderTemplateList(templates: LabTemplate[]): string {
  if (templates.length === 0) {
    return '<p class="template-empty">No lab templates found.</p>';
  }

  return `
    <div class="template-list">
      ${templates
        .map(
          (template) => `
        <article class="template-item">
          <div>
            <h3>${template.name}</h3>
            <p>${template.description}</p>
          </div>
          <span>${template.subject}</span>
        </article>`
        )
        .join('')}
    </div>
  `;
}

export function renderTeacherPanel(
  container: HTMLElement,
  onConfigured: (config: LabConfig) => void
): void {
  container.innerHTML = `
    <header class="app-header">
      <div>
        <a class="home-link" href="/" aria-label="Back to home">Interactive Learning</a>
        <span>AI teaching material builder</span>
      </div>
      <nav aria-label="Material modes">
        <span>2D visuals</span>
        <span>3D labs where allowed</span>
      </nav>
    </header>
    <h1>Teaching Material Builder</h1>
    <p class="subtitle">Type any topic and the tool will create source-based visual teaching material with real images, labels, facts, vocabulary, and video searches.</p>
    <div class="panel">
      <form id="curriculum-form">
        <label for="curriculum-text">Lesson description</label>
        <textarea
          id="curriculum-text"
          placeholder="e.g. tiger for Grade 3, volcano, flower parts, electric circuit, solar system, ancient Egypt"
          required
        ></textarea>
        <button type="submit" id="submit-btn">Create Material</button>
        <p class="error" id="form-error" hidden></p>
      </form>
    </div>
    <div class="panel templates-panel">
      <div class="panel-heading">
        <h2>Available Templates</h2>
        <span id="template-count">Loading...</span>
      </div>
      <div id="templates-list"></div>
    </div>
  `;

  const form = container.querySelector<HTMLFormElement>('#curriculum-form')!;
  const textarea = container.querySelector<HTMLTextAreaElement>('#curriculum-text')!;
  const submitBtn = container.querySelector<HTMLButtonElement>('#submit-btn')!;
  const errorEl = container.querySelector<HTMLParagraphElement>('#form-error')!;
  const templateCountEl = container.querySelector<HTMLElement>('#template-count')!;
  const templatesListEl = container.querySelector<HTMLElement>('#templates-list')!;

  getTemplates()
    .then((templates) => {
      templateCountEl.textContent = `${templates.length} ready`;
      templatesListEl.innerHTML = renderTemplateList(templates);
    })
    .catch((err) => {
      templateCountEl.textContent = 'Unavailable';
      templatesListEl.innerHTML = `<p class="error">${err instanceof Error ? err.message : 'Failed to load templates'}</p>`;
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
      const config = await configureLab(textarea.value);
      onConfigured(config);
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : 'Something went wrong';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Material';
    }
  });
}
