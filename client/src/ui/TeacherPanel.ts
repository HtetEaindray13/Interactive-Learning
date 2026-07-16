import { configureLab } from '../api';
import type { CircuitConfig } from '../scene/CircuitScene';

export function renderTeacherPanel(
  container: HTMLElement,
  onConfigured: (config: CircuitConfig) => void
): void {
  container.innerHTML = `
    <h1>Teacher Setup</h1>
    <p class="subtitle">Paste a curriculum snippet and the agent will configure the circuit lab.</p>
    <div class="panel">
      <form id="curriculum-form">
        <label for="curriculum-text">Lesson description</label>
        <textarea
          id="curriculum-text"
          placeholder="e.g. Grade 4, series vs parallel circuits, focus on why bulbs dim when added in series"
          required
        ></textarea>
        <button type="submit" id="submit-btn">Configure Lab</button>
        <p class="error" id="form-error" hidden></p>
      </form>
    </div>
  `;

  const form = container.querySelector<HTMLFormElement>('#curriculum-form')!;
  const textarea = container.querySelector<HTMLTextAreaElement>('#curriculum-text')!;
  const submitBtn = container.querySelector<HTMLButtonElement>('#submit-btn')!;
  const errorEl = container.querySelector<HTMLParagraphElement>('#form-error')!;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Configuring…';

    try {
      const config = await configureLab(textarea.value);
      onConfigured(config);
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : 'Something went wrong';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Configure Lab';
    }
  });
}
