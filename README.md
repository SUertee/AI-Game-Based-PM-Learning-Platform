# PM Game-Based Learning Platform (Frontend)

An interactive web app that teaches project management through a game flow: students read briefs, play scenarios, make decisions, and get AI feedback; educators build and manage the content in the same UI.

## Main Features

- **Student journey**: dashboard → project brief → quiz → scenario chat → decision → AI evaluation → summary.
- **Educator tools**: configure game info, personas, scenarios, quizzes, tasks/outcomes, and track classes/games.
- **Scenario chat**: converse with in-game personas to gather context before deciding.
- **AI feedback**: immediate scoring, strengths/weaknesses, and rationale on decisions/tasks.

## Highlights

- **AI where it matters**:
  - Persona chat is LLM-driven (stakeholders/teammates).
  - Task evaluation uses an AI service; endpoints/models are swappable.
  - Strengths/weakness summaries condense performance for reports.
- **Feature-first structure**: clear folders per feature (auth, student, educator, game/project/quiz/scenario/evaluation/layout, builder/quiz/scenario/task/persona/layout) so screens are easy to find and extend.
- **Builder + player in one**: same app serves content creators and learners—no context switching.

## How AI is wired

- Services live in `src/services/ollama/*` (chat, evaluation, strengths/weaknesses). Swap endpoints/models there (local or remote LLMs).
- Used in gameplay (`pages/game/evaluation/TaskEvaluation.jsx`, `pages/game/scenario/ScenarioPlay.jsx`), reports (`pages/student/StudentReport.jsx`, `pages/game/evaluation/GameSummary.jsx`), and chat (`components/AIChat.jsx`).

## Run it

1. Backend: `cd Backend && npm install && node server.js` (default `http://localhost:4000`).
2. Frontend: `cd Frontend && npm install && npm run dev` (default `http://localhost:5173`).
3. If backend URL changes, update the fetch base (search `http://localhost:4000` in `src`).

## Quick structure

- `pages/auth|student|educator`
- `pages/game` → `project`, `quiz`, `scenario`, `evaluation`, `layout`
- `pages/builder` → `quiz`, `scenario`, `task`, `persona`, `layout`
- `styles` mirrors the same feature grouping.
