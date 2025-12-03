CREATE SCHEMA game_app;
SET search_path TO game_app;


-- users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  password TEXT NOT NULL
);

-- students
CREATE TABLE students (
  user_id INT PRIMARY KEY,
  strength_weakness TEXT,
  scenario_outcome FLOAT(2),
  quiz_outcome FLOAT(2),
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- games
CREATE TABLE games (
  game_id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL,
  game_title TEXT NOT NULL,
  description TEXT,
  number_of_iteration INTEGER NOT NULL DEFAULT 0 CHECK (number_of_iteration >= 0),
  CONSTRAINT fk_games_creator
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE RESTRICT
);

-- personas
CREATE TABLE personas (
  persona_id SERIAL PRIMARY KEY,
  role TEXT,
  profile TEXT,
  name TEXT,
  attitude TEXT,
  behaviour TEXT
);

-- game_persona_relationship (M:N)
CREATE TABLE game_persona_relationship (
  game_id INT NOT NULL,
  persona_id INT NOT NULL,
  PRIMARY KEY (game_id, persona_id),
  CONSTRAINT fk_gpr_game
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
  CONSTRAINT fk_gpr_persona
    FOREIGN KEY (persona_id) REFERENCES personas(persona_id) ON DELETE RESTRICT
);

-- scenarios
CREATE TABLE scenarios (
  scenario_id SERIAL,
  game_id INT NOT NULL,
  scenario_name TEXT NOT NULL,
  description TEXT,
  sample_questions TEXT,
  sample_answer TEXT,
  actions_to_do TEXT,
  further_constraint TEXT,
  PRIMARY KEY (scenario_id, game_id),
  CONSTRAINT fk_scenarios_game
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

-- quiz_sets
CREATE TABLE quiz_sets (
  game_id INT NOT NULL,
  quiz_id SERIAL,
  immediate_feedback BOOLEAN NOT NULL DEFAULT FALSE,
  timer_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  topic TEXT,
  length INTEGER CHECK (length IS NULL OR length >= 0),
  time_limit_seconds INTEGER CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
  pass_rate NUMERIC(5,2) CHECK (pass_rate IS NULL OR (pass_rate >= 0 AND pass_rate <= 100)),
  PRIMARY KEY (game_id, quiz_id),
  CONSTRAINT fk_quiz_sets_game
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

-- questions
CREATE TABLE questions (
  question_id BIGSERIAL PRIMARY KEY,
  question_description TEXT NOT NULL,
  choice1 TEXT,
  choice2 TEXT,
  choice3 TEXT,
  choice4 TEXT,
  explanation TEXT,
  correct_answer INT CHECK (correct_answer IS NULL OR (correct_answer >= 0 AND correct_answer <= 3))
);

-- quiz_questions (bridge: quiz_set ↔ question)
CREATE TABLE quiz_questions (
  game_id INT NOT NULL,
  quiz_id INT NOT NULL,
  question_id BIGINT NOT NULL,
  PRIMARY KEY (game_id, quiz_id, question_id),
  CONSTRAINT fk_qq_quiz_set
    FOREIGN KEY (game_id, quiz_id) REFERENCES quiz_sets(game_id, quiz_id) ON DELETE CASCADE,
  CONSTRAINT fk_qq_question
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE RESTRICT
);

-- records
CREATE TABLE records (
  played_at TIMESTAMPTZ NOT NULL,
  user_id INT NOT NULL,
  game_id INT NOT NULL,
  scenario_outcome FLOAT(2),
  quiz_outcome FLOAT(2),
  strength_weakness TEXT,

  PRIMARY KEY (user_id, game_id),
  CONSTRAINT fk_records_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_records_game
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

-- helpful indexes
CREATE INDEX idx_games_creator ON games(creator_id);
CREATE INDEX idx_scenarios_game ON scenarios(game_id);
CREATE INDEX idx_quiz_sets_game ON quiz_sets(game_id);
CREATE INDEX idx_records_user ON records(user_id);
