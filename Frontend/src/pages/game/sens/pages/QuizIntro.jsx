
import React, { useMemo } from "react";
import "../../../../styles/game/sens/Cards.css";

export default function QuizIntro({ gameData, ctx }) {
  const { qi = 0, quiz, goNext } = ctx || {};

  const q = useMemo(() => {
    return quiz ?? gameData?.quizzes?.[qi] ?? {};
  }, [quiz, gameData, qi]);

  const passRate = Number.isFinite(q.passRate)
    ? Math.max(0, Math.min(100, Math.round(q.passRate)))
    : 0;

  const questionCount = Array.isArray(q.quizQuestions)
    ? q.quizQuestions.length
    : (q.quizLength ?? 0);

  const timeSeconds = Number.isFinite(q.timeSeconds) ? q.timeSeconds : 0;
  const hasTimer = !!q.timer && timeSeconds > 0;
  const timeLabel = hasTimer
    ? (() => {
        const m = Math.floor(timeSeconds / 60);
        const s = timeSeconds % 60;
        if (s === 0) return `${m} min${m === 1 ? "" : "s"}`;
        if (m === 0) return `${s}s`;
        return `${m}m ${s}s`;
      })()
    : null;

  const feedbackLabel = q.immediateFeedback
    ? "You’ll get feedback after each question."
    : "Feedback will be shown at the end.";

  const handleStart = () => {
    if (typeof goNext === "function") goNext();
  };

  return (
    <div className="panel">
      <div className="h1">gemini
        {q.quizTopic ? `${q.quizTopic} — Quick Knowledge Check` : "Quick Knowledge Check"}
      </div>

      <p className="lead" style={{ marginBottom: 12 }}>
        This quiz helps you refresh key project-management concepts. The scenario you’ll play later
        will test how you apply them in practice.
      </p>

      <ul className="meta" style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", alignItems: "center", gap: 16, flexWrap: "wrap", color: "var(--muted)" }}>
        {questionCount > 0 && <li>Questions: <b>{questionCount}</b></li>}
        <li>Pass mark: <b>{passRate}%</b></li>
        {hasTimer && <li>Time limit: <b>{timeLabel}</b></li>}
        <li>{feedbackLabel}</li>
      </ul>

      <p style={{ marginTop: 0 }}>
        You’ll need to achieve at least <b>{passRate}%</b> to proceed.
      </p>

      <div className="center-actions">
        <button className="cta" onClick={handleStart}>Start Quiz</button>
      </div>
    </div>
  );
}
