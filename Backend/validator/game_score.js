// validateBody.js
module.exports = function validateGameScore(req, res, next) {
  const b = req.body || {};
  const errs = [];

  const reqd = ["gameId", "studentId", "quizScore", "scenarioScore", "strengthAndWeakness"];
  for (const k of reqd) if (!(k in b)) errs.push(`missing: ${k}`);

  if (b.gameId != null && typeof b.gameId !== "number") errs.push("gameId must be number");
  if (b.studentId != null && typeof b.studentId !== "number") errs.push("studentId must be number");
  if (b.quizScore != null && typeof b.quizScore !== "number") errs.push("quizScore must be number");
  if (b.scenarioScore != null && typeof b.scenarioScore !== "number") errs.push("scenarioScore must be number");
  if (b.strengthAndWeakness != null && typeof b.strengthAndWeakness !== "string") errs.push("strengthAndWeakness must be string");

  return errs.length ? res.status(400).json({ error: "invalid body", details: errs }) : next();
};
