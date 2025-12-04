import React, { useMemo } from "react";
import "../../../styles/game/layout/Layout.css";

export default function QuizResultPass({ gameData, ctx }) {
    const { qi = 0, quiz: quizInCtx, outcome, goNext, flow, pageIndex } = ctx || {};
    const quiz = useMemo(() => quizInCtx ?? gameData?.quizzes?.[qi] ?? {}, [quizInCtx, gameData, qi]);

    // fallback to stored localStorage outcome if outcome not passed in
    const storedOutcome = useMemo(() => {
        try {
            const key = `pmGame:${gameData?.gameId ?? "0"}:quiz:${qi}`;
            const raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw);
        } catch { /* empty */ }
        return null;
    }, [gameData, qi]);

    const finalOutcome = outcome ?? storedOutcome ?? {};
    const correct = finalOutcome?.correct ?? 0;
    const total = finalOutcome?.total ?? (Array.isArray(quiz.quizQuestions) ? quiz.quizQuestions.length : 0);
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passRate = Math.max(0, Math.min(100, Math.round(quiz?.passRate ?? 0)));

    const nextStep = flow?.[Math.min((pageIndex ?? 0) + 1, (flow?.length ?? 1) - 1)];
    const nextLabel =
        nextStep?.kind?.startsWith?.("QUIZ_") ? "Next Quiz" :
            nextStep?.kind === "SCENARIO_INTRO" ? "Start Scenario" :
                "Continue";

    const handleProceed = () => {
        if (typeof goNext === "function") goNext();
    };

    return (
        <div className="panel">
            <div className="h1">Quiz Completed</div>
            <p className="lead">
                Congratulations! You passed with a score of <b>{scorePercent}%</b> ( {correct}/{total} ).
                Pass mark: <b>{passRate}%</b>.
            </p>
            <div className="center-actions">
                <button className="cta" onClick={handleProceed}>{nextLabel}</button>
            </div>
        </div>
    );
}
