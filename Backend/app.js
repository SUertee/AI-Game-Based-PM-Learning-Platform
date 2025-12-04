// app.js
const express = require('express');
const db = require('./db');
const cors = require('cors');
const app = express();
app.use(express.json());
module.exports = function makeApp(db){  // pass a pg.Pool or Client
  const app = express();
  app.use(express.json());

app.use(cors({
  origin: "*"
}));

  const validateGameScore = require('./validator/game_score')
  const validateGame = require('./validator/game')

  // Health check
  app.get('/healthz', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      res.send('ok');
    } catch (err) {
      res.status(500).send('db error');
    }
  });


    // Get all available games
    app.get('/games/all', async (req, res) => {
        try {
            const { rows } = await db.query(`
      SELECT 
        g.game_id AS "gameId",
        g.creator_id AS "educatorId",
        u.username AS "educatorName",
        g.game_title AS "gameTitle",
        g.description AS "gameDescription",
        g.number_of_iteration AS "scenarioNum"
      FROM game_app.games g
      LEFT JOIN game_app.users u ON g.creator_id = u.user_id
      ORDER BY g.game_id ASC
    `);
            res.status(200).json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).send('error');
        }
    });

  

  //load game data
  app.get('/games/:id', async (_req, res) => {
      try {
          //get game data
          const { rows: gameRows } = await db.query(
            'SELECT * FROM game_app.games WHERE game_id = $1',
            [_req.params.id]
          );
          if (gameRows.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
          }
          const game = gameRows[0];
          let result = {
            gameId: game.game_id,
            createdBy: game.creator_id,
            gameTitle: game.game_title,
            gameDescription: game.description,
            scenarioNum: game.number_of_iteration,
            personas: [],
            scenarios: [],
            quizzes: []
          };

          const { rows:personaIdRows } = await db.query('SELECT * FROM game_app.game_persona_relationship WHERE game_id = $1', [_req.params.id]);
          for (let i = 0; i < personaIdRows.length; i++) {
              const { rows: personaRows } = await db.query('SELECT * FROM game_app.personas WHERE persona_id = $1', [personaIdRows[i].persona_id]);
              if (personaRows.length > 0) {
                  result.personas.push({
                      "personaId": personaRows[0].persona_id,
                      "personaName": personaRows[0].name,
                      "personaRole": personaRows[0].role,
                      "personaProfile": personaRows[0].profile,
                      "personaTraits": personaRows[0].traits,
                      "personaMotivation": personaRows[0].motivation,
                      "personaAvatar": personaRows[0].avatar,
                      "personaAttitude": personaRows[0].attitude,
                  });
              }
          }
          const { rows: scenariosRows } = await db.query('SELECT * FROM game_app.scenarios WHERE game_id = $1', [_req.params.id]);
          if (scenariosRows.length > 0) {
              result.scenarios = scenariosRows.map(scenario => ({
                  "scenarioId": scenario.scenario_id,
                  "scenarioName": scenario.scenario_name,
                  "description": scenario.description,
                  "actionsToDo": scenario.key_facts,
                  "furtherConstraint": scenario.further_constraint,
                  "sampleQuestions": scenario.sample_questions,
                  "sampleAnswer": scenario.sample_answer
              }));
          }
          const { rows: quizRows } = await db.query('SELECT * FROM game_app.quiz_sets WHERE game_id = $1', [_req.params.id]);
          if (quizRows.length > 0) {
              result.quizzes = quizRows.map(quiz => ({
                  "quizId": quiz.quiz_id,
                  "quizLength": quiz.length,
                  "quizTopic": quiz.topic,
                  "passRate": parseFloat(quiz.pass_rate),
                  "immediateFeedback": quiz.immediate_feedback,
                  "timer": quiz.timer_enabled,
                  "time": 300, //seconds
                  "quizQuestions": []
              }));
          }
          choice_dict = {
              0: "A",
              1: "B",
              2: "C",
              3: "D"
          }
          for (let i = 0; i < result.quizzes.length; i++) {
              const { rows: quizQuestionRows } = await db.query(
                "SELECT qq.game_id, qq.quiz_id, q.question_id, q.question_description, q.choice1, q.choice2, q.choice3, q.choice4, q.explanation, q.correct_answer FROM game_app.quiz_questions qq JOIN game_app.questions q ON q.question_id = qq.question_id WHERE qq.quiz_id = $1 AND qq.game_id = $2",
                [result.quizzes[i].quizId, _req.params.id]
              );
              result.quizzes[i].quizQuestions = quizQuestionRows.map(qq => ({
                  "questionId": parseInt(qq.question_id),
                  "question": qq.question_description,
                  "choices": {
                    "A":qq.choice1,
                    "B":qq.choice2,
                    "C":qq.choice3,
                    "D":qq.choice4
                    },
                  "correctAnswer": choice_dict[qq.correct_answer],
                  "explanation": qq.explanation
              }));
          }
          res.json(result);
      } catch (err) {
          console.error(err);
          res.status(500).send('error');
      }
  });



    app.post('/user/signup', async (req, res) => {
    const { type, username, password } = req.body || {};

    // validation
    if (typeof username !== 'string' || username.trim() === '' ||
        typeof password !== 'string' ||
        typeof type !== 'string' || (type != "student" && type != "educator")) {
      return res.status(400).json({ error: 'Invalid type, username or password' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // pre-check
      const { rows: exists } = await client.query(
        'SELECT 1 FROM game_app.users WHERE username = $1 LIMIT 1',
        [username]
      );
      if (exists.length) {
        await client.query('ROLLBACK');
        return res.status(401).json({ error: 'Username already exists' });
      }

      // create user
      const { rows } = await client.query(
        `INSERT INTO game_app.users (username, password)
         VALUES ($1, $2)
         RETURNING user_id`,
        [username, password] // consider hashing in real code
      );
      const user_id = rows[0].user_id;
      if (type == "student"){  // create student row
        await client.query(
          `INSERT INTO game_app.students (user_id)
          VALUES ($1)`,
          [user_id]
        );
      }
      await client.query('COMMIT');
      if (username == "educator"){
        return res.status(200).json({ id: user_id, type: "educator"});
      }
      else{
        return res.status(200).json({ id: user_id , type: "student"}); 
      }
    } catch (err) {
      // unique violation fallback
      if (err && err.code === '23505') {
        try { await client.query('ROLLBACK'); } catch {}
        return res.status(401).json({ error: 'Username already exists' });
      }
      console.error(err);
      try { await client.query('ROLLBACK'); } catch {}
      return res.status(500).send('error');
    } finally {
      client.release();
    }
  });

  // GET /games/byCreator/:creatorId
  app.get('/games/byCreator/:creatorId', async (req, res) => {
    try {
      const creatorId = req.params.creatorId;

      // 1. get all games made by this creator
      const { rows: gameRows } = await db.query(
        `SELECT game_id, creator_id, game_title, description
        FROM game_app.games
        WHERE creator_id = $1`,
        [creatorId]
      );

      if (gameRows.length === 0) {
        // creator exists but hasn't made any games
        return res.json([]); // return empty array, 200 OK
      }

      // 2. get scenario counts per game in ONE query (more efficient than looping)
      //    We'll LEFT JOIN scenarios and GROUP BY game_id.
      const { rows: scenarioCounts } = await db.query(
        `SELECT g.game_id,
                COUNT(s.scenario_id) AS scenario_num
        FROM game_app.games g
        LEFT JOIN game_app.scenarios s
          ON g.game_id = s.game_id
        WHERE g.creator_id = $1
        GROUP BY g.game_id`,
        [creatorId]
      );

      // Make a lookup map: game_id -> scenario_num
      const scenarioMap = {};
      for (const row of scenarioCounts) {
        scenarioMap[row.game_id] = parseInt(row.scenario_num, 10);
      }

      // 3. shape response for frontend
      const result = gameRows.map(g => ({
        gameId: g.game_id,
        createdBy: g.creator_id,
        gameTitle: g.game_title,
        gameDescription: g.description,
        scenarioNum: scenarioMap[g.game_id] ?? 0
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "error fetching games for creator" });
    }
  });


  // User login
  app.post('/user/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || username.trim() === '' ||
      typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  try {
    const { rows } = await db.query(
      `SELECT password, user_id FROM game_app.users WHERE username = $1`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Username does not exist' });
    }

    const ok = rows[0].password === password;
    if (!ok) {
      return res.status(401).json({ error: 'Invalid password' }); // <--- MISSING CHECK
    }
    if (username == "educator"){
      return res.status(200).json({ id: rows[0].user_id, type: "educator"});
    }
    else{
      return res.status(200).json({ id: rows[0].user_id , type: "student"}); 
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('error');
  }
});



  // Safe: parameterized query
  app.get('/users/:id', async (req, res) => {
    try {
      const { rows } = await db.query(
        'SELECT * FROM game_app.users WHERE user_id = $1',
        [req.params.id]
      );
      res.json(rows[0] || null);
    } catch (err) {
      console.error(err);
      res.status(500).send('error');
    }
  });
  module.exports = app;

  // Return all personas
app.get("/persona/all", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        avatar            AS "personaAvatar",
        persona_id        AS "personaId",
        name              AS "personaName",
        role              AS "personaRole",
        profile           AS "personaProfile",
        motivation        AS "personaMotivation",
        traits            AS "personaTraits",
        attitude          AS "personaAttitude"
      FROM game_app.personas
      ORDER BY persona_id ASC
    `);

    // Optional: log to confirm
    console.log("✅ Persona table fetched:", rows.length, "records");
    res.status(200).json(rows || []);
  } catch (err) {
    console.error("❌ Error fetching personas:", err);
    res.status(500).json({ error: "Failed to fetch personas" });
  }
});


  app.post('/game/score', validateGameScore, async (req, res) => {
    const client = await db.getClient();
    try{
      await client.query('BEGIN');
      const {rows} = await client.query(
        `
        INSERT INTO game_app.records (user_id, game_id, scenario_outcome, quiz_outcome, strength_weakness)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ON CONSTRAINT records_pkey
        DO UPDATE SET
          scenario_outcome   = EXCLUDED.scenario_outcome,
          quiz_outcome       = EXCLUDED.quiz_outcome,
          strength_weakness  = EXCLUDED.strength_weakness
        `,
        [ req.body.studentId, req.body.gameId, req.body.scenarioScore, req.body.quizScore, req.body.strengthAndWeakness]
      );
      const {rows: newScore} = await client.query(
        'SELECT avg(quiz_outcome) as "quizScore", avg(scenario_outcome) as "scenarioScore" FROM game_app.records WHERE user_id = $1',
        [ req.body.studentId]
      );
      new_scenario_outcome = newScore[0].scenarioScore
      new_quiz_outcome = newScore[0].quizScore
      await client.query(
        'UPDATE game_app.students SET  scenario_outcome = $1, quiz_outcome = $2 WHERE user_id = $3',
        [new_scenario_outcome, new_quiz_outcome, req.body.studentId]
      )
      await client.query('COMMIT');
      res.status(200).json({"gameId": req.body.gameId, "studentId": req.body.studentId})
    } catch (err) {
      console.error(err)
      res.status(500).send('error');
    } finally {
      client.release();
    }
  })

  // student overview
  app.get('/student/overview/:id', async (req, res) => {
    const client = await db.getClient();
    try {
      const userId = req.params.id;

      // total number of games
      const { rows: gameRows } = await client.query(
        'SELECT COUNT(*)::int AS count FROM game_app.games'
      );
      const gameNum = gameRows[0].count;

      // how many records this student has
      const { rows: recordRows } = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM game_app.records
         WHERE user_id = $1`,
        [userId]
      );
      const gameComplete = recordRows[0].count;
      // if no record
      if (gameComplete === 0) {
        return res.status(200).json({
          gameNum,
          gameComplete: 0,
          totalQuizScore: 0,
          totalScenarioScore: 0,
          strengthAndWeakness: 'None',
        });
      }

      // aggregated scores stored in students
      const { rows: studentRows } = await client.query(
        `SELECT
           quiz_outcome       AS "totalQuizScore",
           scenario_outcome   AS "totalScenarioScore",
           strength_weakness  AS "strengthAndWeakness"
         FROM game_app.students
         WHERE user_id = $1`,
        [userId]
      );
      //in case no row found
      const agg = studentRows[0] || {
        totalQuizScore: 0,
        totalScenarioScore: 0,
        strengthAndWeakness: 'None',
      };

      const totalQuizScore = Number(agg.totalQuizScore);
      const totalScenarioScore = Number(agg.totalScenarioScore);

      return res.status(200).json({
        gameNum,
        gameComplete,
        totalQuizScore,
        totalScenarioScore,
        strengthAndWeakness: agg.strengthAndWeakness,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send('error');
    } finally {
      client.release();
    }
  });

  // student reports
  app.get('/student/reports/:id', async (req, res) => {
    try{
      const {rows} = await db.query(
        `
        SELECT game_id::int as "gameId", 
          quiz_outcome::int as "quizScore", 
          scenario_outcome::int as "scenarioScore",
          strength_weakness as "strengthAndWeakness"
        FROM game_app.records
        WHERE user_id = $1
        `, [req.params.id]
      )
      res.status(200).json(rows)
    } catch (err) {
      console.error(err);
      return res.status(500).send('error');
    }
  })

  // student performance update
  app.post('/student/performance/:id', async (req, res) => {
    const { strengthAndWeakness } = req.body;
    if (typeof strengthAndWeakness !== "string" || strengthAndWeakness.trim() === "") {
      return res.status(400).json({ detail: "strengthAndWeakness required" });
    }

    const client = await db.getClient();
    try {
      const { rowCount } = await client.query(
        `UPDATE game_app.students
         SET strength_weakness = $1
         WHERE user_id = $2`,
        [strengthAndWeakness, req.params.id]
      );

      if (rowCount === 0) {
          alert("STUDENT NOT FOUND")
        return res.status(404).json({ detail: "student not found" });
      }

      return res.status(200).json({ detail: "successfully update" });
    } catch (err) {
      console.error(err);
      return res.status(500).send("error");
    } finally {
      client.release();
    }
  })


  app.get('/student/performance/:id', async (req, res) => {
    try{
      const {rows} = await db.query(
        `
        SELECT strength_weakness from game_app.records 
        WHERE user_id = $1
        `, [req.params.id]
      )
      if (rows.length === 0) {
      return res.status(200).json({ hasResult: false, result: [] });
    }
    const result = rows.map(r => r.strength_weakness);
    return res.status(200).json({ hasResult: true, result });

    } catch (err) {
      console.error(err)
      res.status(500).send('error');
    }
  })

  // Full game creation endpoint
  app.post('/games/create', validateGame, async (req, res) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // create game
      const { rows: gameRows } = await client.query(
        `INSERT INTO game_app.games(creator_id, game_title, description, number_of_iteration)
        VALUES ($1, $2, $3, $4)
        RETURNING game_id`,
        [req.body.createdBy, req.body.gameTitle, req.body.gameDesc, req.body.numScenario]
      );
      const game_id = gameRows[0].game_id;

      // store game_persona_relationship
      const personas = req.body.personas || [];
      for (let i = 0; i < personas.length; i++) {
        await client.query(
          `INSERT INTO game_app.game_persona_relationship(game_id, persona_id)
          VALUES ($1, $2)`,
          [game_id, personas[i]]
        );
      }

      // create quizzes
      const quizzes = req.body.quizzes || [];
      for (let i = 0; i < quizzes.length; i++) {
        const quiz = quizzes[i];

        await client.query(
          `INSERT INTO game_app.quiz_sets
            (game_id, quiz_id, immediate_feedback, timer_enabled, topic, length, time_limit_seconds, pass_rate)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            game_id,
            quiz.quizId,                // or quiz.quiz_id, but be consistent with payload
            quiz.immediateFeedback,
            quiz.timer,
            quiz.quizTopic,
            quiz.quizLength,
            quiz.time,
            quiz.passRate,
          ]
        );

        // save individual questions
        const choiceDict = { A: 0, B: 1, C: 2, D: 3 };
        const qs = quiz.quizQuestions || [];
        for (let j = 0; j < qs.length; j++) {
          const question = qs[j];
          const { rows: questionRows } = await client.query(
            `INSERT INTO game_app.questions
              (question_description, choice1, choice2, choice3, choice4, explanation, correct_answer)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING question_id`,
            [
              question.question,
              question.choices?.A,
              question.choices?.B,
              question.choices?.C,
              question.choices?.D,
              question.explanation,
              choiceDict[question.correctAnswer],
            ]
          );
          const questionId = questionRows[0].question_id;

          await client.query(
            `INSERT INTO game_app.quiz_questions(game_id, quiz_id, question_id)
            VALUES ($1, $2, $3)`,
            [game_id, quiz.quizId, questionId] // quizId consistent with above
          );
        }
      }

      // create scenarios
      const scenarios = req.body.scenarios || [];
      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        await client.query(
          `INSERT INTO game_app.scenarios(
            scenario_id,
            game_id,
            scenario_name,
            description,
            sample_answer,
            sample_questions,
            key_facts,
            further_constraint,
            time_limit,
            primary_task,
            common_mistakes,
            scoring_rubric,
            success_criteria
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            scenario.scenarioId,
            game_id,
            scenario.scenarioName,
            scenario.description,
            scenario.sampleAnswer,
            scenario.sampleQuestions,   // ensure column names match your schema
            scenario.keyFacts,
            scenario.furtherConstraint,
            scenario.timeLimit,
            scenario.primaryTask,
            scenario.commonMistakes,
            scenario.scoringRubric,
            scenario.successCriteria,
          ]
        );
      }

      await client.query('COMMIT');
      return res.status(200).json({"ok": true});
    } catch (err) {
      console.error(err);
      try { await client.query('ROLLBACK'); } catch (_) {}
      return res.status(500).send('error');
    } finally {
      client.release();
    }
  });


  return app;
}
