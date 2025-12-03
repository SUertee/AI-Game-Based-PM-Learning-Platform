const request = require('supertest');
const makeApp = require('../app'); // import the factory function
const db = require('../db');

const app = makeApp(db);

describe('GET /api/game/:id', () => {
  it('should return the full game structure', async () => {
    const res = await request(app).get('/games/9'); // adjust endpoint

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      gameId: expect.any(Number),
      gameTitle: expect.any(String),
      gameDescription: expect.any(String),
      scenarioNum: expect.any(Number),
      createdBy: expect.any(Number),
      personas: expect.any(Array),
      quizzes: expect.any(Array),
      scenarios: expect.any(Array)
    });

    // Check personas
    res.body.personas.forEach(p => {
      expect(p).toMatchObject({
        personaId: expect.any(Number),
        personaName: expect.any(String),
        personaAvatar: expect.any(String), 
        personaRole: expect.any(String),
        personaProfile: expect.any(String),
        personaTraits: expect.any(String),
        personaMotivation: expect.any(String),
        personaAttitude: expect.any(String)
      });
    });

    // Check quizzes and questions
    res.body.quizzes.forEach(qz => {
      expect(qz).toMatchObject({
        quizId: expect.any(Number),
        quizLength: expect.any(Number),
        quizTopic: expect.any(String),
        passRate: expect.any(Number),
        immediateFeedback: expect.any(Boolean),
        timer: expect.any(Boolean),
        time: expect.any(Number),
        quizQuestions: expect.any(Array)
      });

      qz.quizQuestions.forEach(q => {
        expect(q).toMatchObject({
          questionId: expect.any(Number),
          question: expect.any(String),
          choices: expect.any(Object), // could be dict or array
          correctAnswer: expect.anything(), // number or string
          explanation: expect.any(String)
        });
      });
    });

    // Check scenarios
    res.body.scenarios.forEach(s => {
      expect(s).toMatchObject({
        scenarioId: expect.any(Number),
        scenarioName: expect.any(String),
        description: expect.any(String),
        actionsToDo: expect.any(String),
        furtherConstraint: expect.any(String),
        //sampleQuestions: expect.any(Array),
        sampleAnswer: expect.any(String)
      });
    });
  });
});

afterAll(async () => {
  await db.pool.end();   // closes open connections so Jest can exit
});