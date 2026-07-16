import './style.css';
import { renderTeacherPanel } from './ui/TeacherPanel';
import { renderStudentPanel } from './ui/StudentPanel';
import type { CircuitConfig } from './scene/CircuitScene';

const app = document.querySelector<HTMLElement>('#app')!;

function showTeacherView() {
  renderTeacherPanel(app, (config: CircuitConfig) => {
    showStudentView(config);
  });
}

function showStudentView(config: CircuitConfig) {
  renderStudentPanel(app, config);
}

showTeacherView();
