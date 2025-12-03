const request = require("supertest");
const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Pool } = require("pg");
const makeApp = require("../app");

let container, pool, app;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();

  const uri = container.getConnectionUri();           // ← use URI
  pool = new Pool({ connectionString: uri });
  await pool.query("SELECT 1");

  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS game_app;
    CREATE TABLE IF NOT EXISTS game_app.students(
      user_id INT PRIMARY KEY, scenario_outcome NUMERIC, quiz_outcome NUMERIC, strength_weakness TEXT
    );
    CREATE TABLE IF NOT EXISTS game_app.records(
       user_id INT NOT NULL, game_id INT NOT NULL,
       scenario_outcome NUMERIC, quiz_outcome NUMERIC, strength_weakness TEXT,
       PRIMARY KEY (user_id, game_id)
    );
    CREATE TABLE IF NOT EXISTS game_app.games(
      game_id INT NOT NULL,
      PRIMARY KEY (game_id)
    );
    INSERT INTO game_app.students(user_id, scenario_outcome, quiz_outcome)
    VALUES (1,0,0) ON CONFLICT DO NOTHING;
  `);

  app = makeApp({
    getClient: () => pool.connect(),
    query: (t, p) => pool.query(t, p),
  });
});

afterEach(async () => {
  if (pool) {
    await pool.query("TRUNCATE game_app.records RESTART IDENTITY;");
    await pool.query("TRUNCATE game_app.games RESTART IDENTITY;");
    await pool.query("UPDATE game_app.students SET scenario_outcome=0, quiz_outcome=0;");
  }
});

afterAll(async () => {
  try { if (pool) await pool.end(); } catch {}
  try { if (container) await container.stop(); } catch {}
});

test("POST /game/single record update", async () => {
  //test first insert
  const res = await request(app).post("/game/score").send({
    gameId: 1, studentId: 1, quizScore: 80, scenarioScore: 70, strengthAndWeakness: "ok"
  });
  expect(res.status).toBe(200);

  const { rows: recs } = await pool.query("SELECT * FROM game_app.records");
  expect(recs).toHaveLength(1);

  expect(recs[0]).toMatchObject({
    user_id: 1,
    game_id: 1,
    strength_weakness: "ok",
  });

  expect(Number(recs[0].quiz_outcome)).toBe(80);
  expect(Number(recs[0].scenario_outcome)).toBe(70);

  const { rows: studentRecs } = await pool.query("SELECT * FROM game_app.students");
  expect(Number(studentRecs[0].quiz_outcome)).toBe(80);
  expect(Number(studentRecs[0].scenario_outcome)).toBe(70);
});

test("POST /game/overwrite record update", async () => {
  const res = await request(app).post("/game/score").send({
    gameId: 1, studentId: 1, quizScore: 80, scenarioScore: 70, strengthAndWeakness: "ok"
  });
  expect(res.status).toBe(200);

  const { rows: recs } = await pool.query("SELECT * FROM game_app.records");
  expect(recs).toHaveLength(1);

  expect(recs[0]).toMatchObject({
    user_id: 1,
    game_id: 1,
    strength_weakness: "ok",
  });

  expect(Number(recs[0].quiz_outcome)).toBe(80);
  expect(Number(recs[0].scenario_outcome)).toBe(70);

  const { rows: studentRecs } = await pool.query("SELECT * FROM game_app.students");
  expect(Number(studentRecs[0].quiz_outcome)).toBe(80);
  expect(Number(studentRecs[0].scenario_outcome)).toBe(70);

  //test overwrite record
  const res2 = await request(app).post("/game/score").send({
    gameId: 1, studentId: 1, quizScore: 50, scenarioScore: 50, strengthAndWeakness: "ok"
  });
  expect(res2.status).toBe(200);

  const { rows: replaceRecs } = await pool.query("SELECT * FROM game_app.records");
  expect(replaceRecs).toHaveLength(1);

  expect(replaceRecs[0]).toMatchObject({
    user_id: 1,
    game_id: 1,
    strength_weakness: "ok",
  });

  expect(Number(replaceRecs[0].quiz_outcome)).toBe(50);
  expect(Number(replaceRecs[0].scenario_outcome)).toBe(50);
});

test("POST /game/multiple record insert correctly update overall score", async () => {
  const res = await request(app).post("/game/score").send({
    gameId: 1, studentId: 1, quizScore: 80, scenarioScore: 70, strengthAndWeakness: "ok"
  });
  expect(res.status).toBe(200);

  const { rows: studentRecs } = await pool.query("SELECT * FROM game_app.students");
  expect(Number(studentRecs[0].quiz_outcome)).toBe(80);
  expect(Number(studentRecs[0].scenario_outcome)).toBe(70);

  //test overwrite record
  const res2 = await request(app).post("/game/score").send({
    gameId: 2, studentId: 1, quizScore: 60, scenarioScore: 50, strengthAndWeakness: "ok"
  });
  expect(res2.status).toBe(200);

  const { rows: studentRecs2 } = await pool.query("SELECT * FROM game_app.students");
  expect(Number(studentRecs2[0].quiz_outcome)).toBe(70);
  expect(Number(studentRecs2[0].scenario_outcome)).toBe(60);
});

test("GET /student/overview/:id returns overall score, game completion and strengh weakness when record exists", async () => {
  await pool.query(`
    INSERT INTO game_app.records(user_id, game_id, scenario_outcome, quiz_outcome, strength_weakness)
    VALUES
      (1, 10, 70, 80, 'good comms'),
      (1, 11, 60, 90, 'needs risk mgmt');
  `);
  await pool.query(`
    INSERT INTO game_app.students (user_id, scenario_outcome, quiz_outcome, strength_weakness)
        VALUES (1, 65, 85, 'good')
        ON CONFLICT (user_id)
        DO UPDATE SET
          scenario_outcome   = EXCLUDED.scenario_outcome,
          quiz_outcome       = EXCLUDED.quiz_outcome,
          strength_weakness  = EXCLUDED.strength_weakness
  `);
  await pool.query(`
    INSERT INTO game_app.games(game_id)
    VALUES
      (10),(11),(12),(13);
  `);
  const res = await request(app).get("/student/overview/1");
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    gameNum: 4,
    gameComplete: 2,
    totalQuizScore: 85,
    totalScenarioScore: 65,
    strengthAndWeakness: "good",
  });
})

test("GET /student/overview/:id returns overall score, game completion and strengh weakness when no record", async () => {
  await pool.query(`
    INSERT INTO game_app.games(game_id)
    VALUES
      (10),(11),(12),(13);
  `);
  const res = await request(app).get("/student/overview/1");
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    gameNum: 4,
    gameComplete: 0,
    totalQuizScore: 0,
    totalScenarioScore: 0,
    strengthAndWeakness: "None",
  });
})


test("GET /student/reports/:id returns all records with mapped fields", async () => {
  await pool.query(`
    INSERT INTO game_app.records (user_id, game_id, scenario_outcome, quiz_outcome, strength_weakness)
    VALUES
      (1, 1, 78, 80, 'a'),
      (1, 2, 78, 80, 'b'),
      (1, 3, 78, 80, 'c');
  `);

  const res = await request(app).get("/student/reports/1");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body).toHaveLength(3);

  // Verify structure and values, order-agnostic
  expect(res.body).toEqual(
    expect.arrayContaining([
      { gameId: 1,  quizScore: 80, scenarioScore: 78 , strengthAndWeakness: "a"},
      { gameId: 2,  quizScore: 80, scenarioScore: 78 , strengthAndWeakness: "b"},
      { gameId: 3,  quizScore: 80, scenarioScore: 78 , strengthAndWeakness: "c"},
    ])
  );
});

test("GET /student/reports/:id returns empty list when no records", async () => {
  const res = await request(app).get("/student/reports/999");
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});


test("POST /student/performance/:id updates strength_weakness for existing student", async () => {
  await pool.query(`
    INSERT INTO game_app.students(user_id, scenario_outcome, quiz_outcome, strength_weakness)
    VALUES (2, 0, 0, 'old');
  `);

  const res = await request(app)
    .post("/student/performance/2")
    .send({ strengthAndWeakness: "new value" });

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ detail: "successfully update" });

  const { rows } = await pool.query(
    "SELECT strength_weakness FROM game_app.students WHERE user_id = $1",
    [2]
  );
  expect(rows[0].strength_weakness).toBe("new value");
});


test("POST returns 400 when body is missing required field", async () => {
  await pool.query(`INSERT INTO game_app.students(user_id) VALUES (3);`);

  const res = await request(app).post("/student/performance/3").send({});
  expect([400,422]).toContain(res.status); 
});


test("GET /student/performance/:id returns empty when no records", async () => {
  const res = await request(app).get("/student/performance/999");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ hasResult: false, result: [] });
});


test("GET /student/performance/:id returns strengths when records exist", async () => {
  await pool.query(`
    INSERT INTO game_app.records(user_id, game_id, scenario_outcome, quiz_outcome, strength_weakness)
    VALUES
      (1, 10, 70, 80, 'good comms'),
      (1, 11, 60, 90, 'needs risk mgmt');
  `);

  const res = await request(app).get("/student/performance/1");
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ hasResult: true });
  // assuming API returns list of strings per earlier route
  expect(Array.isArray(res.body.result)).toBe(true);
  expect(res.body.result).toEqual(["good comms", "needs risk mgmt"]);
});