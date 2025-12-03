-- run AFTER your DDL (with the trailing comma removed)
-- and with the same search_path
BEGIN;
SET client_min_messages = NOTICE;
SET search_path TO game_app;

DO $$
DECLARE
  creator_id INT;
  student1_id INT;
  student2_id INT;
  g1 INT;
  p1 INT;
  p2 INT;
  s1 INT;
  qz1 INT;
  q1 BIGINT;
  now_ts TIMESTAMPTZ;
BEGIN
  -- Seed users
  INSERT INTO users(password) VALUES ('pw-creator') RETURNING user_id INTO creator_id;
  INSERT INTO users(password) VALUES ('pw-student') RETURNING user_id INTO student1_id;
  INSERT INTO users(password) VALUES ('pw-student2') RETURNING user_id INTO student2_id;

  -- Student profile
  INSERT INTO students(user_id, strength_weakness) VALUES (student1_id, 'Good');

  -- Game by creator
  INSERT INTO games(creator_id, game_title, description, number_of_iteration)
  VALUES (creator_id, 'Game A', 'Desc', 3)
  RETURNING game_id INTO g1;

  -- Deleting creator must fail while game exists (RESTRICT)
  BEGIN
    DELETE FROM users WHERE user_id = creator_id;
    RAISE EXCEPTION 'FAIL: expected FK restriction when deleting creator with games';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: delete creator blocked by FK.';
  END;

  -- games.number_of_iteration check
  BEGIN
    INSERT INTO games(creator_id, game_title, number_of_iteration) VALUES (creator_id, 'Bad Game', -1);
    RAISE EXCEPTION 'FAIL: negative number_of_iteration accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: games.number_of_iteration check works.';
  END;

  --Personas and M:N relation
  INSERT INTO personas(role, profile, name, attitude, motivation, avatar, traits)
  VALUES ('Teacher', 'Profile', 'Alice', 'Strict', 'Calm', '/avator', 'traits')
  RETURNING persona_id INTO p1;

  INSERT INTO game_persona_relationship(game_id, persona_id) VALUES (g1, p1);

  -- Duplicate relation must fail
  BEGIN
    INSERT INTO game_persona_relationship(game_id, persona_id) VALUES (g1, p1);
    RAISE EXCEPTION 'FAIL: duplicate game_persona_relationship allowed';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: game_persona_relationship PK prevents duplicates.';
  END;

  -- Persona delete must be RESTRICTed while referenced
  BEGIN
    DELETE FROM personas WHERE persona_id = p1;
    RAISE EXCEPTION 'FAIL: persona delete should be restricted while referenced';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: persona delete restricted.';
  END;

  -- Add another persona and link for later cascade via game delete
  INSERT INTO personas(role, profile, name, attitude, motivation, avatar, traits)
  VALUES ('Agent', 'P2', 'Bob', 'Neutral','Calm', '/avator', 'traits')
  RETURNING persona_id INTO p2;
  INSERT INTO game_persona_relationship(game_id, persona_id) VALUES (g1, p2);

  -- Scenario
  INSERT INTO scenarios(game_id, scenario_name, description, sample_questions, sample_answer, actions_to_do, further_constraint)
  VALUES (g1, 'Scenario 1', 'S desc', 'Q?', 'A', 'Act', 'None')
  RETURNING scenario_id INTO s1;

  -- scenarios composite PK blocks duplicates for same (scenario_id, game_id)
  BEGIN
    INSERT INTO scenarios(scenario_id, game_id, scenario_name)
    VALUES (s1, g1, 'Dup');
    RAISE EXCEPTION 'FAIL: duplicate (scenario_id, game_id) allowed';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: scenarios composite PK works.';
  END;

  -- Quiz set with valid checks
  INSERT INTO quiz_sets(game_id, immediate_feedback, timer_enabled, topic, length, time_limit_seconds, pass_rate)
  VALUES (g1, TRUE, TRUE, 'Security', 5, 60, 60.00)
  RETURNING quiz_id INTO qz1;

  -- quiz_sets check: pass_rate > 100 must fail
  BEGIN
    INSERT INTO quiz_sets(game_id, pass_rate) VALUES (g1, 120.0);
    RAISE EXCEPTION 'FAIL: pass_rate > 100 accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: quiz_sets.pass_rate check works.';
  END;

  -- quiz_sets check: nonpositive time_limit_seconds must fail
  BEGIN
    INSERT INTO quiz_sets(game_id, time_limit_seconds) VALUES (g1, 0);
    RAISE EXCEPTION 'FAIL: nonpositive time_limit_seconds accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: quiz_sets.time_limit_seconds check works.';
  END;

  -- quiz_sets check: negative length must fail
  BEGIN
    INSERT INTO quiz_sets(game_id, length) VALUES (g1, -2);
    RAISE EXCEPTION 'FAIL: negative length accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: quiz_sets.length check works.';
  END;

  -- Question with valid index answer 0..3
  INSERT INTO questions(question_description, choice1, choice2, choice3, choice4, explanation, correct_answer)
  VALUES ('2+2=?', '3', '4', '5', '6', 'Basic math', 1)  -- index of "4"
  RETURNING question_id INTO q1;

  -- Question check must fail if index > 3
  BEGIN
    INSERT INTO questions(question_description, correct_answer)
    VALUES ('Bad', 4);
    RAISE EXCEPTION 'FAIL: invalid correct_answer index accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: questions.correct_answer range check works.';
  END;

  -- Link quiz_set <-> question
  INSERT INTO quiz_questions(game_id, quiz_id, question_id) VALUES (g1, qz1, q1);

  -- FK to non-existent quiz must fail
  BEGIN
    INSERT INTO quiz_questions(game_id, quiz_id, question_id) VALUES (g1, qz1 + 9999, q1);
    RAISE EXCEPTION 'FAIL: quiz_questions accepted non-existent quiz_set';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: quiz_questions FK to quiz_sets works.';
  END;

  -- Deleting a referenced question must be RESTRICTed
  BEGIN
    DELETE FROM questions WHERE question_id = q1;
    RAISE EXCEPTION 'FAIL: question delete should be restricted while referenced';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASS: question delete restricted.';
  END;

  -- Record play
  now_ts := clock_timestamp();
  INSERT INTO records(user_id, game_id, scenario_outcome, quiz_outcome, strength_weakness)
  VALUES (student1_id, g1, 80, 90, 'Good');

  -- Duplicate composite PK must fail
  BEGIN
    INSERT INTO records(user_id, game_id) VALUES (student1_id, g1);
    RAISE EXCEPTION 'FAIL: duplicate records row allowed';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: records composite PK prevents duplicates.';
  END;

  -- Cascade: deleting user -> students and records removed
  INSERT INTO students(user_id, strength_weakness) VALUES (student2_id, 'OK');
  INSERT INTO records(user_id, game_id) VALUES ( student2_id, g1);
  DELETE FROM users WHERE user_id = student2_id;
  IF EXISTS (SELECT 1 FROM students WHERE user_id = student2_id) THEN
    RAISE EXCEPTION 'FAIL: students not cascaded on user delete';
  ELSE
    RAISE NOTICE 'PASS: user->students cascade works.';
  END IF;
  IF EXISTS (SELECT 1 FROM records WHERE user_id = student2_id) THEN
    RAISE EXCEPTION 'FAIL: records not cascaded on user delete';
  ELSE
    RAISE NOTICE 'PASS: user->records cascade works.';
  END IF;

  -- Cascade: deleting game -> scenarios, quiz_sets, quiz_questions, GPR, records
  DELETE FROM games WHERE game_id = g1;

  IF EXISTS (SELECT 1 FROM scenarios WHERE game_id = g1) THEN
    RAISE EXCEPTION 'FAIL: scenarios not cascaded on game delete';
  ELSE
    RAISE NOTICE 'PASS: game->scenarios cascade works.';
  END IF;

  IF EXISTS (SELECT 1 FROM quiz_sets WHERE game_id = g1) THEN
    RAISE EXCEPTION 'FAIL: quiz_sets not cascaded on game delete';
  ELSE
    RAISE NOTICE 'PASS: game->quiz_sets cascade works.';
  END IF;

  IF EXISTS (SELECT 1 FROM quiz_questions WHERE game_id = g1) THEN
    RAISE EXCEPTION 'FAIL: quiz_questions not cascaded on game delete';
  ELSE
    RAISE NOTICE 'PASS: game->quiz_questions cascade works.';
  END IF;

  IF EXISTS (SELECT 1 FROM game_persona_relationship WHERE game_id = g1) THEN
    RAISE EXCEPTION 'FAIL: GPR not cascaded on game delete';
  ELSE
    RAISE NOTICE 'PASS: game->GPR cascade works.';
  END IF;

  IF EXISTS (SELECT 1 FROM records WHERE game_id = g1) THEN
    RAISE EXCEPTION 'FAIL: records not cascaded on game delete';
  ELSE
    RAISE NOTICE 'PASS: game->records cascade works.';
  END IF;

  -- Now creator can be deleted
  DELETE FROM users WHERE user_id = creator_id;
  IF EXISTS (SELECT 1 FROM users WHERE user_id = creator_id) THEN
    RAISE EXCEPTION 'FAIL: creator not deletable after game removal';
  ELSE
    RAISE NOTICE 'PASS: creator deletion after removing game ok.';
  END IF;

  -- Cleanup residual personas
  DELETE FROM personas WHERE persona_id IN (p1, p2);

  RAISE NOTICE 'All tests executed.';
END
$$;

ROLLBACK;
