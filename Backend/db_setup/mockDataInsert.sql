BEGIN;
SET search_path TO game_app;

DO $$
DECLARE
  creator_id INT;
  g1 INT;
  p1 INT;
  p2 INT;
  p3 INT;
  p4 INT;
  p5 INT;
  s1 INT;
  qz1 INT;
  q1 BIGINT;
  q2 BIGINT;
  q3 BIGINT;
BEGIN
  -- Seed creator
  INSERT INTO users(password) VALUES ('pw-creator') RETURNING user_id INTO creator_id;

  -- Seed personas (one RETURNING per row)
  INSERT INTO personas(role, profile, name, attitude, behaviour)
  VALUES ('Tracker', 'Profile', 'Alice', 'Strict', 'Calm')
  RETURNING persona_id INTO p1;

  INSERT INTO personas(role, profile, name, attitude, behaviour)
  VALUES ('Programmer', 'Profile', 'Bob', 'Curious', 'Active')
  RETURNING persona_id INTO p2;

  INSERT INTO personas(role, profile, name, attitude, behaviour)
  VALUES ('Doomsayer', 'Profile', 'Charlie', 'Supportive', 'Involved')
  RETURNING persona_id INTO p3;

  INSERT INTO personas(role, profile, name, attitude, behaviour)
  VALUES ('Tester', 'Profile', 'Diana', 'Empathetic', 'Patient')
  RETURNING persona_id INTO p4;

  INSERT INTO personas(role, profile, name, attitude, behaviour)
  VALUES ('Researcher', 'Profile', 'Eve', 'Helpful', 'Organized')
  RETURNING persona_id INTO p5;

  -- Game by creator
  INSERT INTO games(creator_id, game_title, description, number_of_iteration)
  VALUES (
    creator_id,
    'Game-based Learning Platform',
    '{\"time_period\":\"The original timeline was 10 weeks, but two sprints have been cut due to backend delays. The new target is 8 weeks to align with a final marketing campaign milestone. Critical milestones include parallel development and contractor onboarding. Any time trade-offs must be reviewed with the sponsor.\",\"scope_statement\":\"Deliver a fully functional mobile app with secure authentication, real-time notifications, and basic analytics. All features must be production-ready and accessible; any scope reduction must be justified with stakeholder approval and risk mitigation.\",\"budget\":\"Budget is capped at $200,000 AUD with no contingency remaining. Additional funding requires executive approval and ROI. Contractor rates and overtime must be tracked and justified.\"}',
    1
  )
  RETURNING game_id INTO g1;

  -- Link personas to game
  INSERT INTO game_persona_relationship(game_id, persona_id) VALUES
    (g1, p1),
    (g1, p2),
    (g1, p3),
    (g1, p4),
    (g1, p5);

  -- Scenario for game
  INSERT INTO scenarios(
    game_id, scenario_name, description, sample_questions, sample_answer, actions_to_do, further_constraint
  )
  VALUES (
    g1,
    'Stakeholder requests AI integration in the middle of sprint',
    'Midway through the sprint, a senior stakeholder from the Strategy & Innovation team requests the integration of an AI-powered recommendation engine into the customer dashboard. The feature was not part of the original scope, and no budget or timeline buffer was allocated for AI development. The stakeholder argues that this addition could significantly boost user engagement and attract investor interest, but the engineering team warns of architectural complexity and potential delays. Budget: $150,000 AUD remaining, no contingency Time: 4 weeks left until public launch Scope: Core dashboard features, analytics, and user settings — AI not included',
    '[\"what is the impact on time?\",\"what is your current progress?\",\"Do we have the skill?\"]',
    'Decision: Defer AI integration to a post-launch iteration to protect the MVP launch date.\n\nRationale (Frameworks)\nTriple Constraint: Holding scope constant now avoids schedule/budget slip.\nMoSCoW: AI = Could/Should; MVP items = Must.\nRACI: Sponsor/PM own change-control; Eng Lead runs feasibility spike; UX flags impacts; QA validates regressions.\nRisk: Log scope creep; plan a feature-flag pilot next iteration to de-risk.',
    'Review scope & change-control impact. Draft 2 to 3 options with trade-offs and timelines. Prepare stakeholder comms plan & decision log.',
    'Technical debt & integration risks.\nInvestor narrative vs. launch certainty.\nPilot/feature flag to de-risk timelines.'
  )
  RETURNING scenario_id INTO s1;

  -- Quiz set (use time_limit_seconds; return quiz_id)
  INSERT INTO quiz_sets(game_id, immediate_feedback, timer_enabled, topic, length, time_limit_seconds, pass_rate)
  VALUES (g1, TRUE, TRUE, 'Scope Management', 3, 300, 70.0)
  RETURNING quiz_id INTO qz1;

  -- Questions (insert into questions, not quiz_questions)
  INSERT INTO questions(question_description, choice1, choice2, choice3, choice4, explanation, correct_answer)
  VALUES (
    'What is the primary risk of adding unplanned features mid-sprint?',
    'Increased technical debt',
    'Scope creep leading to delays',
    'Higher budget expenditure',
    'Reduced team morale',
    'Scope creep can derail timelines and budgets, impacting project success.',
    1
  )
  RETURNING question_id INTO q1;

  INSERT INTO questions(question_description, choice1, choice2, choice3, choice4, explanation, correct_answer)
  VALUES (
    'Which framework helps prioritize features based on their necessity?',
    'SWOT Analysis',
    'MoSCoW Method',
    'PERT Chart',
    'Fishbone Diagram',
    'MoSCoW categorizes features into Must, Should, Could, and Won''t have.',
    1
  )
  RETURNING question_id INTO q2;

  INSERT INTO questions(question_description, choice1, choice2, choice3, choice4, explanation, correct_answer)
  VALUES (
    'Who is typically responsible for approving scope changes?',
    'Project Manager',
    'Development Team',
    'Stakeholders/Sponsors',
    'Quality Assurance Team',
    'Stakeholders or sponsors usually have the authority to approve scope changes.',
    2
  )
  RETURNING question_id INTO q3;

  -- Link questions to quiz set (table is quiz_questions)
  INSERT INTO quiz_questions(game_id, quiz_id, question_id) VALUES
    (g1, qz1, q1),
    (g1, qz1, q2),
    (g1, qz1, q3);
END
$$;

COMMIT;
