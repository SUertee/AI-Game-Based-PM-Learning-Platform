// __tests__/games/create.create.db.test.js
const request = require("supertest");
const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Pool } = require("pg");
const makeApp = require("../app"); // 你的应用工厂，内部路由用 query/getClient 访问 DB

let container, pool, app;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  pool = new (require("pg").Pool)({ connectionString: container.getConnectionUri() });
  await pool.query("SELECT 1");

  // ——最小可用 schema：按你的实际实现调整——
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS game_app;

    CREATE TABLE IF NOT EXISTS game_app.games(
      game_id SERIAL PRIMARY KEY,
      game_title TEXT NOT NULL,
      description TEXT NOT NULL,
      number_of_iteration INT NOT NULL,
      creator_id INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_app.game_persona_relationship(
      game_id INT NOT NULL,
      persona_id INT NOT NULL,
      PRIMARY KEY (game_id, persona_id)
    );

    CREATE TABLE IF NOT EXISTS game_app.scenarios(
      game_id INT NOT NULL,
      scenario_id INT NOT NULL,
      scenario_name TEXT NOT NULL,
      description TEXT NOT NULL,
      time_limit INT NOT NULL,
      primary_task TEXT NOT NULL,
      key_facts TEXT NOT NULL,
      further_constraint TEXT NOT NULL,
      sample_questions TEXT[],
      sample_answer TEXT NOT NULL,
      common_mistakes TEXT NOT NULL,
      scoring_rubric TEXT NOT NULL,
      success_criteria TEXT NOT NULL,
      PRIMARY KEY (game_id, scenario_id),
      FOREIGN KEY (game_id) REFERENCES game_app.games(game_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_app.quiz_sets(
      game_id INT NOT NULL,
      quiz_id INT NOT NULL,
      topic TEXT NOT NULL,
      pass_rate INT NOT NULL,
      immediate_feedback BOOLEAN NOT NULL,
      timer_enabled BOOLEAN NOT NULL,
      time_limit_seconds INT NOT NULL,
      length INT NOT NULL,
      PRIMARY KEY (game_id, quiz_id),
      FOREIGN KEY (game_id) REFERENCES game_app.games(game_id) ON DELETE CASCADE
    );

     CREATE TABLE IF NOT EXISTS game_app.questions(
      question_id SERIAL PRIMARY KEY,
      question_description TEXT NOT NULL,
      choice1 TEXT,
      choice2 TEXT,
      choice3 TEXT,
      choice4 TEXT,
      explanation TEXT NOT NULL,
      correct_answer TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_app.quiz_questions(
      game_id INT NOT NULL,
      quiz_id INT NOT NULL,
      question_id INT NOT NULL,
      PRIMARY KEY (game_id, quiz_id, question_id),
      FOREIGN KEY (game_id, quiz_id) REFERENCES game_app.quiz_sets(game_id, quiz_id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES game_app.questions(question_id) ON DELETE CASCADE
    );
  `);

  app = makeApp({
    getClient: () => pool.connect(),
    query: (text, params) => pool.query(text, params),
  });
});

// ---- helpers ----
function validBody() {
  return {
    gameTitle: "Title",
    gameDesc: "The background of the game..",
    numScenario: 2,
    createdBy: 1,
    personas: [1, 2, 3, 4, 5],
    quizzes: [
      {
        quizId: 1,
        quizLength: 4,
        quizTopic: "Scope management",
        passRate: 70,
        immediateFeedback: false,
        timer: true,
        time: 20,
        quizQuestions: [
          {
            question: "What component...",
            choices: { A: "Scope", B: "Objective", C: "Milestone", D: "risk mitigation" },
            correctAnswer: "D",
            explanation: "Because risk mitigation belongs to risk management",
          },
          {
            question: "Q2",
            choices: { A: "a", B: "b", C: "c", D: "d" },
            correctAnswer: "A",
            explanation: "ok",
          },
          {
            question: "Q3",
            choices: { A: "a", B: "b", C: "c", D: "d" },
            correctAnswer: "B",
            explanation: "ok",
          },
          {
            // array-shape question also allowed
            question: "Q4",
            choices: { A: "a", B: "b", C: "c", D: "d" },
            correctAnswer: "B",
            explanation: "ok",
          },
        ],
      },
      {
        quizId: 2,
        quizLength: 1,
        quizTopic: "topic",
        passRate: 70,
        immediateFeedback: true,
        timer: true,
        time: 300,
        quizQuestions: [
          {
            questionId: 1,
            question: "questions",
            choices: { A: "a", B: "b", C: "c", D: "d" },
            correctAnswer: "B",
            explanation: "explanation",
          },
        ],
      },
    ],
    scenarios: [
      {
        scenarioId: 1,
        scenarioName: "Stakeholder requests AI integration",
        description: "desc",
        timeLimit: 600,
        primaryTask: "qwe",
        keyFacts: "facts",
        furtherConstraint: "constraint",
        sampleQuestions: ["q1", "q2"],
        sampleAnswer: "answer",
        commonMistakes: "mistakes",
        scoringRubric: "rubric",
        successCriteria: "success",
      },
      {
        scenarioId: 2,
        scenarioName: "name",
        description: "description",
        timeLimit: 60,
        primaryTask: "qwe",
        keyFacts: "actions",
        furtherConstraint: "constraint",
        sampleQuestions: ["q1"],
        sampleAnswer: "sample answer",
        commonMistakes: "cm",
        scoringRubric: "rubric",
        successCriteria: "ok",
      },
    ],
  };
}

afterAll(async () => {
  try { if (pool) await pool.end(); } catch {}
  try { if (container) await container.stop(); } catch {}
});

test("POST /games/create rejects missing required top-level fields", async () => {
  const body = { ...validBody() };
  delete body.gameTitle;
  delete body.scenarios;
  const res = await request(app).post("/games/create").send(body);
  expect(res.status).toBe(400);
  expect(res.body.error).toBe("invalid body");
  expect(res.body.details).toEqual(
    expect.arrayContaining(["missing: gameTitle", "missing: scenarios"])
  );
});

test("POST /games/create rejects non-unique personas", async () => {
  const body = { ...validBody(), personas: [1, 2, 2] };
  const res = await request(app).post("/games/create").send(body);
  expect(res.status).toBe(400);
  expect(res.body.details).toEqual(expect.arrayContaining(["personas must be unique"]));
});

test("POST /games/create rejects when numScenario ≠ scenarios.length", async () => {
  const body = { ...validBody(), numScenario: 3 };
  const res = await request(app).post("/games/create").send(body);
  expect(res.status).toBe(400);
  expect(res.body.details).toEqual(
    expect.arrayContaining([`numScenario must equal scenarios.length (2)`])
  );
});

test("POST /games/create rejects quizLength mismatch", async () => {
  const body = validBody();
  body.quizzes[0].quizLength = 3; // but array has 4
  const res = await request(app).post("/games/create").send(body);
  expect(res.status).toBe(400);
  expect(res.body.details).toEqual(
    expect.arrayContaining([
      `quizzes[0].quizLength must equal quizQuestions.length (4)`,
    ])
  );
});

test("POST /games/create rejects bad question shape", async () => {
  const body = validBody();
  // Break a question: choices array of wrong length
  body.quizzes[1].quizQuestions[0].choices = { A: "a", B: "b", C: "c" };
  const res = await request(app).post("/games/create").send(body);
  expect(res.status).toBe(400);
  expect(res.body.details).toEqual([
  'missing: quizzes[1].quizQuestions[0].choices.D'
]);
});

test("POST /games/create rejects types: createdBy must be int", async () => {
  const body = { ...validBody(), createdBy: "1" };
  const res = await request(app).post("/games/create").send(body);
  expect(res.status).toBe(400);
  expect(res.body.details).toEqual(
    expect.arrayContaining([`createdBy must be int`])
  );
});

test("POST /games/create persists game, scenarios, quizzes, and questions", async () => {
  const body = validBody();

  const res = await request(app).post("/games/create").send(body);
  console.log(res.body)
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });

  // 1) games
  const g = await pool.query(`SELECT game_id, game_title, description, creator_id FROM game_app.games`);
  expect(g.rows).toHaveLength(1);
  expect(g.rows[0]).toMatchObject({ game_id: 1, game_title: "Title", description: "The background of the game..", creator_id: 1 });
  const gameId = g.rows[0].game_id;

  // 2) scenarios 
  const sc = await pool.query(`SELECT * FROM game_app.scenarios WHERE game_id = $1 ORDER BY scenario_id`, [gameId]);
  expect(sc.rows).toHaveLength(2);
  expect(sc.rows[0]).toMatchObject({ scenario_id: 1, scenario_name: "Stakeholder requests AI integration", time_limit: 600 });
  expect(sc.rows[1]).toMatchObject({ scenario_id: 2, scenario_name: "name", time_limit: 60 });

  // 3) quizzes 
  const qz = await pool.query(`SELECT * FROM game_app.quiz_sets WHERE game_id = $1 ORDER BY quiz_id`, [gameId]);
  expect(qz.rows).toHaveLength(2);
  expect(qz.rows[0]).toMatchObject({ quiz_id: 1, topic: "Scope management", pass_rate: 70, length: 4 });
  expect(qz.rows[1]).toMatchObject({ quiz_id: 2, topic: "topic", pass_rate: 70, length: 1 });

  // 4) quiz_questions：
  const qq = await pool.query(`SELECT * FROM game_app.quiz_questions qq JOIN game_app.questions q USING (question_id) WHERE game_id = $1 ORDER BY quiz_id, question_id`, [gameId]);
  expect(qq.rows).toHaveLength(5);
  console.log(qq.rows)
  const first = qq.rows.find(r => r.quiz_id === 1 && r.question_id === 1);
  expect(first.question_description).toBe("What component...");
  expect(first.explanation).toBeTruthy();
  expect(first.choice1).toBe("Scope");
  
  expect(sc.rows).toHaveLength(body.numScenario);
});
