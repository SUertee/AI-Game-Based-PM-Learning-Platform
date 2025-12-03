// src/pages/QuizQuestion.jsx
import React, { useMemo, useState, useEffect } from "react";
import "../../../styles/game/project/Cards.css";

export default function QuizQuestion({ gameData, ctx }) {
  const {
    qi = 0,
    qj = 0,
    quiz: quizInCtx,
    question: questionInCtx,
    goPrev,
    goNext,
    onQuizComplete,
  } = ctx || {};

  const quiz = useMemo(
    () => quizInCtx ?? gameData?.quizzes?.[qi] ?? null,
    [quizInCtx, gameData, qi]
  );
  const question = useMemo(
    () => questionInCtx ?? quiz?.quizQuestions?.[qj] ?? null,
    [questionInCtx, quiz, qj]
  );

  if (!quiz || !question) {
    return (
      <div className="panel">
        <div className="h2">Oops—no question found</div>
        <p>Quiz or question data is missing. Try going back and starting again.</p>
        {typeof goPrev === "function" && (
          <button className="btn" onClick={goPrev}>← Back</button>
        )}
      </div>
    );
  }

  const total = Array.isArray(quiz.quizQuestions) ? quiz.quizQuestions.length : 0;
  const isLast = qj >= total - 1;
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const correctIndex = Number.isFinite(question.correctIndex) ? question.correctIndex : 0;

  const storageKey = `pmGame:${gameData?.gameId ?? "0"}:quiz:${qi}`;
  const [selected, setSelected] = useState(null);

  // 当问题索引(qj)改变时,重置选择为null(清空)
  useEffect(() => {
    setSelected(null);
  }, [qj]);

  // 当选择改变时,保存到sessionStorage
  useEffect(() => {
    if (selected === null) return; // 不保存null值
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      saved[qj] = selected;
      sessionStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {}
  }, [selected, qj, storageKey]);

  const disableNext = selected == null;

  const handleNext = () => {
    if (selected == null) return;
    if (typeof goNext === "function") goNext();
  };

  const handlePrev = () => {
    if (typeof goPrev === "function") goPrev();
  };

  const handleSubmit = () => {
    if (selected == null) return;

    let correct = 0;
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      for (let j = 0; j < total; j++) {
        const picked = typeof saved[j] === "number" ? saved[j] : null;
        const cj = Number.isFinite(quiz.quizQuestions?.[j]?.correctIndex)
          ? quiz.quizQuestions[j].correctIndex
          : 0;
        if (picked != null && picked === cj) correct++;
      }
    } catch {}

    if (typeof onQuizComplete === "function") {
      onQuizComplete({
        qi,
        correct,
        total,
        passRate: quiz.passRate ?? 0,
      });
    }
  };

  const showImmediate = !!quiz.immediateFeedback && selected != null;
  const alphabet = ["A", "B", "C", "D"];

  return (
    <div style={{ padding: "24px" }}>
      <div className="panel" style={{ textAlign: "left", maxWidth: 840, margin: "0 auto" }}>
        <div className="h1" style={{ textAlign: "left" }}>
          Question {qj + 1} of {total}
        </div>

        <div className="quiz-card">
          <div style={{ textAlign: "left", fontWeight: 700 }}>
            Q{qj + 1} / {total}: {question.question || ""}
          </div>

          <div className="options">
            {choices.map((opt, i) => (
              <div
                key={i}
                className={`option ${selected === i ? "selected" : ""}`}
                onClick={() => setSelected(i)}
              >
                <b>{alphabet[i] || String(i + 1)}</b>&nbsp; {opt}
              </div>
            ))}
          </div>

          {showImmediate && (
            <div className="explain">
              {selected === correctIndex ? (
                <span className="note-ok">Correct.</span>
              ) : (
                <>
                  <span className="note-bad">Incorrect.</span>{" "}
                  The correct answer is <b>{choices[correctIndex]}</b>.
                </>
              )}{" "}
              <span>{question.explanation}</span>
            </div>
          )}
        </div>

        <div className="footer-nav">
          <button className="backbtn" onClick={handlePrev}>❮ Previous Question</button>
          {!isLast ? (
            <button className="nextbtn" disabled={disableNext} onClick={handleNext}>
              Next Question ❯
            </button>
          ) : (
            <button className="nextbtn" disabled={disableNext} onClick={handleSubmit}>
              Submit Quiz ❯
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
