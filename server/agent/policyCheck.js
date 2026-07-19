import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const policyPath = join(__dirname, '..', 'policy', 'subjectPolicy.json');
const policyLogPath = join(__dirname, '..', 'data', 'policyLog.json');

function loadPolicy() {
  return JSON.parse(readFileSync(policyPath, 'utf-8'));
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function subjectText(parsedCurriculum, curriculumText) {
  return [
    curriculumText,
    parsedCurriculum?.subject,
    parsedCurriculum?.topic,
    parsedCurriculum?.objective,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function canonicalSubject(parsedCurriculum, curriculumText) {
  const subject = normalize(parsedCurriculum?.subject);
  const text = subjectText(parsedCurriculum, curriculumText);

  if (subject.includes('history') || /\b(world war|ancient|empire|civilization|historical|revolution)\b/.test(text)) {
    return 'history';
  }

  if (subject.includes('biology') || /\b(biology|digestive|human body|cell|organ|organism|animal|plant|ecosystem|habitat)\b/.test(text)) {
    return 'biology';
  }

  if (subject.includes('math') || /\b(math|mathematics|slope|linear|graph|function|equation|quadratic|coordinate|fractions?|decimal|percent|geometry|shape|angle|area|volume|algebra|multiply|division|ratio|probability)\b/.test(text)) {
    return 'mathematics';
  }

  if (subject.includes('physics') || /\b(circuit|electricity|pendulum|force|motion|energy|voltage|resistance)\b/.test(text)) {
    return 'physics';
  }

  if (subject.includes('chemistry') || /\b(chemistry|atom|molecule|reaction|acid|base)\b/.test(text)) {
    return 'chemistry';
  }

  return subject;
}

function matchAllowedTopic(subjectPolicy, parsedCurriculum, curriculumText) {
  const text = subjectText(parsedCurriculum, curriculumText);
  const topics = subjectPolicy.topics ?? [];

  return topics.find((topic) =>
    (topic.keywords ?? []).some((keyword) => text.includes(String(keyword).toLowerCase()))
  );
}

export function checkSubjectPolicy(parsedCurriculum, curriculumText) {
  const policy = loadPolicy();
  const subject = canonicalSubject(parsedCurriculum, curriculumText);
  const denied = policy.deniedSubjects?.[subject];

  if (denied) {
    return {
      allowed: true,
      restrict3D: true,
      subject,
      topic: parsedCurriculum?.topic ?? '',
      reason: denied.reason,
      suggestion: denied.suggestion,
    };
  }

  const allowedSubject = policy.allowedSubjects?.[subject];
  if (!allowedSubject) {
    return {
      allowed: true,
      subject,
      topic: parsedCurriculum?.topic ?? '',
    };
  }

  const topic = matchAllowedTopic(allowedSubject, parsedCurriculum, curriculumText);
  if (!topic) {
    return {
      allowed: true,
      subject,
      topic: parsedCurriculum?.topic ?? '',
      matchedTemplate: null,
      reason: allowedSubject.notBuiltMessage,
      suggestion: 'Keep this as a 2D teaching material for now, or add a new template for this topic.',
    };
  }

  return {
    allowed: true,
    subject,
    topic: parsedCurriculum?.topic ?? topic.name,
    matchedTopic: topic.name,
    matchedTemplate: topic.templateId,
  };
}

export function createPolicyResponse(decision, parsedCurriculum) {
  return {
    allowed: decision.allowed,
    restrict3D: decision.restrict3D ?? false,
    matchedTemplate: decision.matchedTemplate ?? null,
    templateId: decision.matchedTemplate ?? null,
    templateName: decision.allowed ? 'Template Not Built Yet' : '3D Material Blocked',
    sceneType: 'policy_message',
    subject: decision.subject ?? parsedCurriculum?.subject ?? '',
    topic: decision.topic ?? parsedCurriculum?.topic ?? '',
    objective: parsedCurriculum?.objective ?? '',
    ageLevel: parsedCurriculum?.ageLevel ?? '',
    reason: decision.reason,
    suggestion: decision.suggestion,
    narration: decision.reason ?? '',
    guidingQuestions: [],
  };
}

export function logPolicyDenial(parsedCurriculum, decision) {
  mkdirSync(dirname(policyLogPath), { recursive: true });

  const entry = {
    timestamp: new Date().toISOString(),
    subject: decision.subject ?? parsedCurriculum?.subject ?? '',
    topic: decision.topic ?? parsedCurriculum?.topic ?? '',
    reason: decision.reason ?? '',
  };

  try {
    const current = existsSync(policyLogPath)
      ? JSON.parse(readFileSync(policyLogPath, 'utf-8'))
      : [];
    current.push(entry);
    writeFileSync(policyLogPath, `${JSON.stringify(current, null, 2)}\n`);
  } catch {
    appendFileSync(policyLogPath, `${JSON.stringify(entry)}\n`);
  }
}
