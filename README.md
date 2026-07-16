# AI Agent for 3D Virtual Lab Generation — MVP

**Track:** PKU DIIdea 2026, Group IV — AI-Enhanced Learning Innovation
**MVP scope:** teacher inputs a curriculum snippet → agent configures a pre-built **circuit lab** template → student runs it risk-free in the browser.

## Contributors

- [MyoKyal](https://github.com/MyoKyal)
- [yoon04](https://github.com/yoon04)
- [HayThar](https://github.com/HayThar1824)
---

## 1. What this is

An agent that takes a teacher's lesson text (e.g. "Grade 4, series vs parallel circuits, focus on why bulbs dim when added in series") and configures a pre-built 3D circuit simulation to match — picking difficulty, generating guiding questions, and flagging safety concepts — instead of generating 3D content from scratch. One template, done well, is the whole MVP.

```
Teacher input (text)
        │
        ▼
Curriculum parsing agent (Gemini)
        │
        ▼
Template library (metadata match) ──▶ only one template for MVP: circuit
        │
        ▼
Customization engine (Gemini) — variables, hints, narration
        │
        ▼
Student 3D lab session (Three.js)
        │
        ▼
Assessment & analytics (logged, shown back to teacher)
```

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| 3D rendering | **Three.js** (r160+) | Pure JS, lightweight, huge docs/example base — good fit for Cursor's inline completions |
| Frontend framework | **Vite + vanilla JS/TS** (no React needed for MVP) | Keeps the 3D scene code simple; add React later only if the teacher-facing dashboard grows |
| Backend | **Node.js + Express** | One small API server: receives curriculum text, calls Gemini, returns config JSON |
| LLM | **Google Gemini API** (you already have a key) | `gemini-3.5-flash` is Google's current stable Flash model for Gemini API text generation |
| Data storage (MVP) | **Local JSON file** or **lowdb** (no real DB needed yet) | Logs of sessions, no need for Postgres/Mongo at this stage |
| Physics for circuit | **Simple manual circuit math**, not a physics engine | Series/parallel resistance and brightness only need Ohm's law — don't reach for Cannon.js/Rapier for this |

**Cursor-specific note:** Cursor free tier limits how many AI requests you get per month, so write the boilerplate (Vite scaffold, Express skeleton) yourself with standard CLI tools first, and save Cursor's AI credits for the actually tricky parts — the Three.js scene logic and the Gemini prompt design.

---

## 3. Repo structure

```
lab-agent/
├── server/
│   ├── index.js              # Express app entry
│   ├── routes/
│   │   └── configure.js      # POST /api/configure — main agent endpoint
│   ├── agent/
│   │   ├── parseCurriculum.js   # Step 1: extract topic/level/objective
│   │   └── customizeTemplate.js # Step 2: generate variables/hints/narration
│   ├── templates/
│   │   └── circuit.json      # Template metadata (see section 5)
│   └── data/
│       └── sessions.json     # Logged session results (MVP storage)
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── main.ts           # Vite entry
│   │   ├── scene/
│   │   │   ├── CircuitScene.ts   # Three.js scene setup
│   │   │   └── circuitMath.ts    # Series/parallel resistance + brightness calc
│   │   ├── ui/
│   │   │   ├── TeacherPanel.ts   # Curriculum input form
│   │   │   └── StudentPanel.ts   # Lab controls + hints display
│   │   └── api.ts            # Calls to backend /api/configure
│   └── vite.config.ts
├── .env                      # GEMINI_API_KEY=...
├── .env.example
├── package.json
└── README.md
```

---

## 4. Setup

```bash
# 1. Scaffold
mkdir lab-agent && cd lab-agent
npm create vite@latest client -- --template vanilla-ts
mkdir server && cd server && npm init -y && npm install express cors dotenv @google/generative-ai
cd ..

# 2. Environment
cp .env.example .env
# then edit .env:
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-3.5-flash
# PORT=3001

# 3. Run backend
cd server && node index.js

# 4. Run frontend (separate terminal)
cd client && npm install three && npm run dev
```

Open the frontend to `http://localhost:5173`, backend runs on `http://localhost:3001`.

**Gemini setup specifics:**
- Get a key at https://aistudio.google.com/apikey (you said you have one already).
- Install: `npm install @google/generative-ai`
- Never commit `.env` — add it to `.gitignore` immediately.

---

## 5. Template metadata schema

This is the contract between the parsing agent and the customization engine. One file per template; MVP has exactly one: `circuit.json`.

```json
{
  "id": "circuit_basic",
  "subject": "physics",
  "concepts": ["series circuits", "parallel circuits", "resistance", "brightness"],
  "ageRange": [8, 12],
  "adjustableVariables": {
    "circuitType": ["series", "parallel"],
    "numberOfBulbs": { "min": 1, "max": 4 },
    "batteryVoltage": { "min": 1.5, "max": 9, "unit": "V" },
    "resistancePerBulb": { "min": 1, "max": 10, "unit": "ohm" }
  },
  "defaultHints": [
    "What happens to bulb brightness when you add another bulb in series?",
    "Compare total resistance between series and parallel setups."
  ],
  "safetyNotes": [
    "In a real circuit, short-circuiting a battery can cause overheating — this sim shows why safely."
  ]
}
```

---

## 6. Agent logic (the two Gemini calls)

### Step 1 — `parseCurriculum.js`
**Input:** raw teacher text.
**Output (JSON):** `{ subject, topic, ageLevel, objective }`

Prompt sketch:
```
You are a curriculum parser for a lab-simulation system.
Given a teacher's lesson description, extract STRICT JSON only, no prose:
{ "subject": "...", "topic": "...", "ageLevel": "...", "objective": "..." }

Teacher input: "<<insert text>>"
```

### Step 2 — `customizeTemplate.js`
**Input:** parsed curriculum object + the matched template's metadata (`circuit.json`).
**Output (JSON):** concrete variable values + 3-5 guiding questions + narration text, all tailored to the objective.

Prompt sketch:
```
You are configuring a 3D circuit lab for a specific lesson.
Template constraints: <<insert adjustableVariables from circuit.json>>
Lesson objective: <<insert objective from step 1>>
Age level: <<insert ageLevel>>

Return STRICT JSON only:
{
  "circuitType": "series" | "parallel",
  "numberOfBulbs": <int>,
  "batteryVoltage": <number>,
  "resistancePerBulb": <number>,
  "guidingQuestions": ["...", "..."],
  "narration": "one paragraph, age-appropriate, introducing the lab"
}
```

**Important for MVP:** for template matching, skip building a real matching algorithm — with only one template, `customizeTemplate.js` is called directly after parsing. Add real template-matching logic only once you have 2+ templates.

---

## 7. Circuit physics (keep it simple)

No physics engine needed. Just Ohm's law:

```ts
// circuitMath.ts
function seriesResistance(resistancePerBulb: number, count: number) {
  return resistancePerBulb * count;
}

function parallelResistance(resistancePerBulb: number, count: number) {
  return 1 / ((1 / resistancePerBulb) * count);
}

function bulbBrightness(voltage: number, totalResistance: number, circuitType: 'series' | 'parallel', count: number) {
  const totalCurrent = voltage / totalResistance;
  const currentPerBulb = circuitType === 'series' ? totalCurrent : totalCurrent / count;
  return Math.min(1, currentPerBulb / 1.0); // normalize 0–1 for bulb glow intensity
}
```

Feed `bulbBrightness` output into a Three.js `MeshStandardMaterial.emissiveIntensity` per bulb mesh — that's your entire "visual physics."

---

## 8. Assessment & logging (MVP version)

Just append to `server/data/sessions.json` on session end:

```json
{
  "sessionId": "uuid",
  "timestamp": "ISO date",
  "objective": "...",
  "questionsAnswered": 3,
  "totalQuestions": 5,
  "timeSpentSeconds": 240
}
```

No dashboard needed for MVP — a simple `GET /api/sessions` endpoint that returns the array is enough to demo "the loop closes back to the teacher."

---

## 9. Suggested semester timeline

| Weeks | Milestone |
|---|---|
| 1–2 | Vite + Three.js scaffold, static circuit scene (no agent yet), manual variable sliders |
| 3–4 | Express server, Gemini integration, `parseCurriculum.js` working end-to-end |
| 5–6 | `customizeTemplate.js`, wire agent output into the Three.js scene dynamically |
| 7–8 | Guiding questions UI, session logging, narration display |
| 9–10 | Pilot use — you and classmates act as "teacher" and "student," collect real usage data |
| 11–12 | Polish, write up findings, prep the competition submission materials |
| 13+ | Buffer / stretch: add a second template if time allows |

---


## 10. Open questions for the team to confirm before coding starts

1. Who owns the Three.js scene vs. who owns the backend/agent code — split by strength?
2. Should the teacher-input form be a separate page/route, or the same page as the student view with a mode toggle?
3. Do we want session logs downloadable as CSV for the competition write-up, or is the JSON file enough for evidence?

---

## 11. Stretch goals (post-MVP, not required for submission)

- Second template (acid-base reaction) to demonstrate the architecture generalizes.
- Voice narration via browser TTS instead of just displayed text.
- Teacher dashboard showing aggregated class performance across sessions.


## 12. Gemini API Key

Store your Gemini API key in `.env` only:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash
```
