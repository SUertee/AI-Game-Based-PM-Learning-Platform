import React, { useMemo } from "react";
import "../../../../styles/game/sens/Layout.css";

export default function QuizResultFail({ gameData, ctx }) {
    const { qi = 0, quiz: quizInCtx, outcome, goTo } = ctx || {};
    const quiz = useMemo(() => quizInCtx ?? gameData?.quizzes?.[qi] ?? {}, [quizInCtx, gameData, qi]);

    const correct = outcome?.correct ?? 0;
    const total = outcome?.total ?? (Array.isArray(quiz.quizQuestions) ? quiz.quizQuestions.length : 0);
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passRate = Math.max(0, Math.min(100, Math.round(quiz?.passRate ?? 0)));

    const handleRetry = () => {
        try {
            const storageKey = `pmGame:${gameData?.gameId ?? "0"}:quiz:${qi}`;
            localStorage.removeItem(storageKey);
        } catch {}
        if (typeof goTo === "function") goTo(`QUIZ_${qi}_INTRO`);
    };

    return (
        <div className="panel">
            <div className="h1">Quiz Completed</div>
            <p className="lead" style={{ color: "var(--danger)" }}>
                You scored <b>{scorePercent}%</b> ( {correct}/{total} ), below the pass mark of <b>{passRate}%</b>.
                Please review the material and retake the quiz before continuing.
            </p>
            <div className="center-actions">
                <button className="cta" onClick={handleRetry}>Re-attempt Quiz</button>
            </div>
        </div>
    );
}
