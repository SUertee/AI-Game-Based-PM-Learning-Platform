// test/auth.test.js
const request = require("supertest");
const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const { Pool } = require("pg");
const makeApp = require("../app");

let container, pool, app;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const uri = container.getConnectionUri();
  pool = new Pool({ connectionString: uri });
  await pool.query("SELECT 1");

  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS game_app;

    CREATE TABLE IF NOT EXISTS game_app.users(
      user_id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_app.students(
      user_id INT PRIMARY KEY REFERENCES game_app.users(user_id) ON DELETE CASCADE
    );
  `);

  app = makeApp({
    getClient: () => pool.connect(),
    query: (t, p) => pool.query(t, p),
  });
});

afterEach(async () => {
  await pool.query(`
    TRUNCATE game_app.students, game_app.users RESTART IDENTITY CASCADE;
  `);
});

afterAll(async () => {
  try { await pool.end(); } catch {}
  try { await container.stop(); } catch {}
});

test("POST /user/signup creates student and returns user_id", async () => {
  const res = await request(app).post("/user/signup").send({
    type: "student",
    username: "alice",
    password: "password123"
  });
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ user_id: expect.any(Number) });

  const { rows: sRows } = await pool.query(
    "SELECT 1 FROM game_app.students WHERE user_id = $1",
    [res.body.user_id]
  );
  expect(sRows.length).toBe(1);
});

test("POST /user/signup creates educator and returns user_id", async () => {
  const res = await request(app).post("/user/signup").send({
    type: "educator",
    username: "bob",
    password: "password123"
  });
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ user_id: expect.any(Number) });
});

test("POST /user/signup duplicate username → 401", async () => {
  await request(app).post("/user/signup").send({
    type: "student",
    username: "dup",
    password: "password123"
  }).expect(200);

  const res = await request(app).post("/user/signup").send({
    type: "student",
    username: "dup",
    password: "password123"
  });

  expect(res.status).toBe(401);
  expect(res.body).toEqual({ error: "Username already exists" });
});

test("POST /user/signup invalid body → 400", async () => {
  // missing password
  const r1 = await request(app).post("/user/signup").send({
    type: "student",
    username: "bad1"
  });
  expect(r1.status).toBe(400);
  expect(r1.body).toEqual({ error: "Invalid type, username or password" });

  // bad type password
  const r2 = await request(app).post("/user/signup").send({
    type: "student",
    username: "bad2",
    password: 21321
  });
  expect(r2.status).toBe(400);
  expect(r2.body).toEqual({ error: "Invalid type, username or password" });

  // invalid type
  const r3 = await request(app).post("/user/signup").send({
    type: "unknown",
    username: "bad3",
    password: "password123"
  });
  expect([400,422]).toContain(r3.status);
});

test("POST /user/login succeeds after signup", async () => {
  await request(app).post("/user/signup").send({
    type: "student",
    username: "login_user",
    password: "password123"
  }).expect(200);

  const res = await request(app).post("/user/login").send({
    username: "login_user",
    password: "password123"
  });

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ login: true });
});

test("POST /user/login failed after signup", async () => {
  await request(app).post("/user/signup").send({
    type: "student",
    username: "login_user",
    password: "password123"
  }).expect(200);

  const res = await request(app).post("/user/login").send({
    username: "login_user",
    password: "password321"
  });

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ login: false });
});

test("POST /user/login invalid username", async () => {
  const res = await request(app).post("/user/login").send({
    username: "invalid_user",
    password: "password123"
  });

  expect(res.status).toBe(401);
  expect(res.body).toEqual({ error: "Username does not exist" });
});
