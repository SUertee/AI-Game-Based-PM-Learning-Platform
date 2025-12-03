module.exports = function validateGameRequest(req, res, next) {
  const b = req.body || {};
  const errs = [];

  // ---- required top-level fields ----
  const reqd = [
    "gameTitle",
    "gameDesc",
    "numScenario",
    "createdBy",
    "personas",
    "quizzes",
    "scenarios",
  ];
  for (const k of reqd) if (!(k in b)) errs.push(`missing: ${k}`);

  // ---- primitive type checks ----
  if (b.gameTitle != null && typeof b.gameTitle !== "string") errs.push("gameTitle must be string");
  if (b.gameDesc != null && typeof b.gameDesc !== "string") errs.push("gameDesc must be string");
  if (b.numScenario != null && !Number.isInteger(b.numScenario)) errs.push("numScenario must be int");
  if (b.createdBy != null && !Number.isInteger(b.createdBy)) errs.push("createdBy must be int");

  // ---- personas ----
  if (b.personas != null && !Array.isArray(b.personas)) {
    errs.push("personas must be array");
  } else if (Array.isArray(b.personas)) {
    const notInts = b.personas.filter(v => !Number.isInteger(v) || v <= 0);
    if (notInts.length) errs.push("personas must be positive ints");
    const set = new Set(b.personas);
    if (set.size !== b.personas.length) errs.push("personas must be unique");
  }

  // ---- quizzes ----
  if (b.quizzes != null && !Array.isArray(b.quizzes)) {
    errs.push("quizzes must be array");
  } else if (Array.isArray(b.quizzes)) {
    b.quizzes.forEach((q, qi) => validateQuiz(q, qi, errs));
  }

  // ---- scenarios ----
  if (b.scenarios != null && !Array.isArray(b.scenarios)) {
    errs.push("scenarios must be array");
  } else if (Array.isArray(b.scenarios)) {
    b.scenarios.forEach((s, si) => validateScenario(s, si, errs));
  }

  // ---- cross-field checks ----
  if (Array.isArray(b.scenarios) && Number.isInteger(b.numScenario)) {
    if (b.numScenario !== b.scenarios.length) {
      errs.push(`numScenario must equal scenarios.length (${b.scenarios.length})`);
    }
  }

  return errs.length ? res.status(400).json({ error: "invalid body", details: errs }) : next();
};

// ---------- helpers ----------
function validateQuiz(q, qi, errs) {
  const base = `quizzes[${qi}]`;
  const reqd = [
    "quizId",
    "quizLength",
    "quizTopic",
    "passRate",
    "immediateFeedback",
    "timer",
    "time",
    "quizQuestions",
  ];
  for (const k of reqd) if (!(k in (q || {}))) errs.push(`missing: ${base}.${k}`);

  if (!isPosInt(q.quizId)) errs.push(`${base}.quizId must be positive int`);
  if (!Number.isInteger(q.quizLength) || q.quizLength < 1) errs.push(`${base}.quizLength must be int >= 1`);
  if (typeof q.quizTopic !== "string" || !q.quizTopic.trim()) errs.push(`${base}.quizTopic must be non-empty string`);
  if (!Number.isInteger(q.passRate) || q.passRate < 0 || q.passRate > 100) errs.push(`${base}.passRate must be int 0..100`);
  if (typeof q.immediateFeedback !== "boolean") errs.push(`${base}.immediateFeedback must be boolean`);
  if (typeof q.timer !== "boolean") errs.push(`${base}.timer must be boolean`);
  if (!isPosInt(q.time)) errs.push(`${base}.time must be positive int`);
  if (!Array.isArray(q.quizQuestions) || q.quizQuestions.length < 1) {
    errs.push(`${base}.quizQuestions must be non-empty array`);
  } else {
    if (Number.isInteger(q.quizLength) && q.quizLength !== q.quizQuestions.length) {
      errs.push(`${base}.quizLength must equal quizQuestions.length (${q.quizQuestions.length})`);
    }
    q.quizQuestions.forEach((qq, qqi) => validateQuestion(qq, qi, qqi, errs));
  }
}

function validateQuestion(qq, qi, qqi, errs) {
  const base = `quizzes[${qi}].quizQuestions[${qqi}]`;
  if (!qq || typeof qq !== "object") {
    errs.push(`${base} must be object`);
    return;
  }
  // Common required fields
  if (!("question" in qq)) errs.push(`missing: ${base}.question`);
  if (!("choices" in qq)) errs.push(`missing: ${base}.choices`);
  if (!("correctAnswer" in qq)) errs.push(`missing: ${base}.correctAnswer`);
  if (!("explanation" in qq)) errs.push(`missing: ${base}.explanation`);

  if (typeof qq.question !== "string" || !qq.question.trim()) errs.push(`${base}.question must be non-empty string`);
  if (typeof qq.explanation !== "string" || !qq.explanation.trim()) errs.push(`${base}.explanation must be non-empty string`);

  //  choices is object with A-D strings, correctAnswer is "A".."D"
   if (qq.choices && typeof qq.choices === "object") {
    // Shape A
    const keys = ["A", "B", "C", "D"];
    for (const k of keys) {
      if (!(k in qq.choices)) errs.push(`missing: ${base}.choices.${k}`);
      else if (typeof qq.choices[k] !== "string" || !qq.choices[k].trim()) {
        errs.push(`${base}.choices.${k} must be non-empty string`);
      }
    }
    if (!["A", "B", "C", "D"].includes(qq.correctAnswer)) {
      errs.push(`${base}.correctAnswer must be one of "A","B","C","D" when choices is object`);
    }
  } else {
    errs.push(`${base}.choices must be object{A..D} `);
  }
}

function validateScenario(s, si, errs) {
  const base = `scenarios[${si}]`;
  const reqd = [
    "scenarioId",
    "scenarioName",
    "description",
    "timeLimit",
    "primaryTask",
    "keyFacts",
    "furtherConstraint",
    "sampleQuestions",
    "sampleAnswer",
    "commonMistakes",
    "scoringRubric",
    "successCriteria",
  ];
  for (const k of reqd) if (!(k in (s || {}))) errs.push(`missing: ${base}.${k}`);

  if (!isPosInt(s.scenarioId)) errs.push(`${base}.scenarioId must be positive int`);
  if (typeof s.scenarioName !== "string" || !s.scenarioName.trim()) errs.push(`${base}.scenarioName must be non-empty string`);
  if (typeof s.description !== "string" || !s.description.trim()) errs.push(`${base}.description must be non-empty string`);
  if (!isPosInt(s.timeLimit)) errs.push(`${base}.timeLimit must be positive int`);
  for (const k of ["primaryTask","keyFacts","furtherConstraint","sampleAnswer","commonMistakes","scoringRubric","successCriteria"]) {
    if (typeof s[k] !== "string" || !s[k].trim()) errs.push(`${base}.${k} must be non-empty string`);
  }
  if (!Array.isArray(s.sampleQuestions) || s.sampleQuestions.length < 1 || s.sampleQuestions.some(q => typeof q !== "string" || !q.trim())) {
    errs.push(`${base}.sampleQuestions must be non-empty array of non-empty strings`);
  }
}

function isPosInt(n) {
  return Number.isInteger(n) && n > 0;
}