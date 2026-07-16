import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import configureRouter from './routes/configure.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const sessionsPath = join(__dirname, 'data/sessions.json');

app.use(cors());
app.use(express.json());

function readSessions() {
  if (!existsSync(sessionsPath)) {
    writeFileSync(sessionsPath, '[]', 'utf-8');
    return [];
  }
  return JSON.parse(readFileSync(sessionsPath, 'utf-8'));
}

function writeSessions(sessions) {
  writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2), 'utf-8');
}

app.use('/api/configure', configureRouter);

app.get('/api/sessions', (_req, res) => {
  try {
    const sessions = readSessions();
    res.json(sessions);
  } catch (err) {
    console.error('GET /api/sessions error:', err);
    res.status(500).json({ error: 'Failed to read sessions.' });
  }
});

app.post('/api/sessions', (req, res) => {
  const { objective, questionsAnswered, totalQuestions, timeSpentSeconds } = req.body ?? {};

  if (
    typeof objective !== 'string' ||
    typeof questionsAnswered !== 'number' ||
    typeof totalQuestions !== 'number' ||
    typeof timeSpentSeconds !== 'number'
  ) {
    return res.status(400).json({
      error: 'Body must include objective (string), questionsAnswered, totalQuestions, and timeSpentSeconds (numbers).',
    });
  }

  try {
    const sessions = readSessions();
    const session = {
      sessionId: randomUUID(),
      timestamp: new Date().toISOString(),
      objective,
      questionsAnswered,
      totalQuestions,
      timeSpentSeconds,
    };
    sessions.push(session);
    writeSessions(sessions);
    res.status(201).json(session);
  } catch (err) {
    console.error('POST /api/sessions error:', err);
    res.status(500).json({ error: 'Failed to save session.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
