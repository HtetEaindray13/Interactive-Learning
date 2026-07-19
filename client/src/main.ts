import './style.css';
import { renderTeacherPanel } from './ui/TeacherPanel';
import { renderStudentPanel } from './ui/StudentPanel';
import type { LabConfig } from './scene/types';

const app = document.querySelector<HTMLElement>('#app')!;

function showTeacherView() {
  renderTeacherPanel(app, (config: LabConfig) => {
    showStudentView(config);
  });
}

function showStudentView(config: LabConfig) {
  renderStudentPanel(app, config);
}

showTeacherView();
