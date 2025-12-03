# Copilot Instructions for SOFT3888 Game-Based Learning Platform

## Project Overview
This is a **game-based scenario learning platform** with three main components:
- **Backend**: Node.js/Express API with PostgreSQL (Supabase) – game data, user auth, scoring
- **Frontend**: React + Vite – multi-role game interface, quiz system, scenario progression
- **Benchmark**: Python evaluation suite – LLM persona responses (GPT, Ollama, NLI scoring)

The platform teaches project management through interactive scenarios with AI-driven personas.

## Architecture Patterns

### Backend (Express + PostgreSQL)
- **App factory pattern**: `app.js` exports `makeApp(db)` function; `server.js` instantiates and listens
- **Request validation**: Use validator modules in `Backend/validator/` before processing (e.g., `validateGame`, `validateGameScore`)
- **Database access**: All queries go through `db.js` (connection pooling via Supabase)
- **CORS enabled** for all origins (`cors` middleware in `app.js`)
- **Health check**: `GET /healthz` for service readiness
- **API response format**: `{ "key": "camelCase" }` for all data (snake_case converted in queries)

### Frontend (React + Vite)
- **Router structure**: `src/App.jsx` centralized routes; pages organized by feature (e.g., `Game_Harry/`, `Builder_Jerry/`, `Dashboard_Jake/`)
- **Context API**: `GameContext.jsx` manages `gameId` with localStorage persistence for state across pages
- **Component patterns**: 
  - Page components receive `ctx` prop containing state (e.g., `{ qi, quiz, goNext }` in `QuizIntro.jsx`)
  - Functional components with `useMemo` for expensive calculations
  - CSS modules per component (e.g., `Cards.css`, `GamePlay.css`)
- **Data flow**: Single game object contains nested `quizzes[]`, `scenarios[]`, `personas[]` loaded once and passed down

### Database Schema
- Main tables: `users`, `games`, `scenarios`, `quizzes`, `personas`, `game_scores`
- User types: `student` or `educator` (stored in signup)
- Game progression: scenario → quiz → evaluation flow
- See `Backend/db_setup/` for schema definitions

## Critical Developer Workflows

### Backend
```bash
# Development (watch mode)
cd Backend && npm run dev

# Testing
npm test  # Jest with PostgreSQL testcontainers

# Database setup
psql < db_setup/setup.sql
psql < db_setup/mockDataInsert.sql
```

### Frontend
```bash
cd Frontend
npm run dev      # Vite dev server (HMR enabled)
npm run build    # Production build
npm run lint     # ESLint check
```

### Docker Deployment
```bash
cd Backend
docker-compose up  # Starts API + pgBouncer (connection pooling to Supabase)
```

## Project-Specific Conventions

### API Endpoint Naming
- `GET /games/all` – list all games (camelCase response keys)
- `GET /games/:id` – single game with all nested data (personas, scenarios, quizzes)
- `POST /user/login`, `POST /user/signup` – auth endpoints
- Validation before response (see `Backend/validator/` examples)

### Frontend State Management
- **No Redux**: Use Context API + local component state (simpler for this size)
- **localStorage**: Persist `gameId` to survive page refreshes
- **Data prop drilling**: Game data passed through page hierarchy rather than fetched per-component

### Code Style
- **Backend**: CommonJS (`require`/`module.exports`), snake_case in SQL, camelCase in JSON responses
- **Frontend**: ES6 modules, React functional components, CSS per-component
- **File naming**: Component files are `.jsx`, utility/context are `.js`

## Key Files to Know
- **Backend API entry**: `Backend/app.js` (all route definitions)
- **Database config**: `Backend/db.js` (Supabase connection string)
- **Frontend routing**: `Frontend/src/App.jsx` (all routes)
- **Game context**: `Frontend/src/context/GameContext.jsx` (shared state)
- **Example component**: `Frontend/src/pages/Game_Sens/pages/QuizIntro.jsx` (props-based component pattern)
- **API specs**: `Backend/API.md` (request/response formats)

## Integration Points & External Dependencies

### Supabase PostgreSQL
- Connected via `db.js` with connection pooling (5 max connections)
- Uses pgBouncer for production (session-level pooling)
- SSL required; reject_unauthorized disabled (Supabase requirement)

### LLM Integration (Benchmark)
- Python scripts evaluate LLM persona responses (GPT, Ollama, Llama3)
- NLI (Natural Language Inference) checks factuality
- Style classifiers trained per persona (in `Style_Adherence/`)
- Not integrated into main app; separate evaluation workflow

## Testing
- **Backend**: Jest with testcontainers (PostgreSQL isolation per test)
- **Frontend**: ESLint configured; no unit tests currently
- **Test setup**: `Backend/test/setup.js` sets 60-second timeout for DB tests

## Common Tasks

### Adding a new API endpoint
1. Create route in `Backend/app.js`
2. Add validation in `Backend/validator/` if needed
3. Use camelCase response keys (convert from snake_case SQL)
4. Document in `Backend/API.md`

### Adding a frontend page
1. Create component in `Frontend/src/pages/`
2. Add route to `Frontend/src/App.jsx`
3. Use `GameContext.useGame()` if you need persisted gameId
4. Create companion CSS in `Frontend/src/styles/` or inline

### Debugging
- Backend: `console.error()` logs appear in terminal running `npm run dev`
- Frontend: Vite console + React DevTools in browser
- Database: Query errors logged; check Supabase dashboard for connection issues
