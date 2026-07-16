import { saveSession } from '../api';
import { initCircuitScene, type CircuitConfig } from '../scene/CircuitScene';

export function renderStudentPanel(container: HTMLElement, config: CircuitConfig): void {
  const startTime = Date.now();
  let sessionSaved = false;

  const totalQuestions = config.guidingQuestions.length;

  container.innerHTML = `
    <h1>Circuit Lab</h1>
    <p class="subtitle">${config.circuitType === 'series' ? 'Series' : 'Parallel'} circuit · ${config.numberOfBulbs} bulb(s)</p>
    <div class="panel">
      <p class="narration">${config.narration}</p>
      <h2>Guiding Questions</h2>
      <ul class="questions-list" id="questions-list">
        ${config.guidingQuestions
          .map(
            (q, i) => `
          <li>
            <input type="checkbox" id="q-${i}" data-index="${i}" />
            <label for="q-${i}">${q}</label>
          </li>`
          )
          .join('')}
      </ul>
      <div class="scene-container" id="scene-container"></div>
      <div class="finish-row">
        <button type="button" id="finish-btn">Finish Session</button>
        <span class="session-status" id="session-status" hidden>Session saved!</span>
      </div>
    </div>
  `;

  const sceneContainer = container.querySelector<HTMLElement>('#scene-container')!;
  initCircuitScene(sceneContainer, config);

  const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  const finishBtn = container.querySelector<HTMLButtonElement>('#finish-btn')!;
  const statusEl = container.querySelector<HTMLElement>('#session-status')!;

  async function finishSession() {
    if (sessionSaved) return;

    const questionsAnswered = Array.from(checkboxes).filter((cb) => cb.checked).length;
    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      await saveSession({
        objective: config.objective ?? 'Circuit lab session',
        questionsAnswered,
        totalQuestions,
        timeSpentSeconds,
      });
      sessionSaved = true;
      statusEl.hidden = false;
      finishBtn.disabled = true;
    } catch (err) {
      statusEl.textContent = err instanceof Error ? err.message : 'Failed to save session';
      statusEl.hidden = false;
      statusEl.style.color = '#f87171';
    }
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      const allChecked = Array.from(checkboxes).every((box) => box.checked);
      if (allChecked && totalQuestions > 0) {
        finishSession();
      }
    });
  });

  finishBtn.addEventListener('click', finishSession);
}
