import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Navigate, useParams } from "react-router-dom";

import Stepper from './layout/Stepper.jsx';
import PageShell from './layout/PageShell.jsx';

import ProjectBriefIntro from './project/ProjectBriefIntro.jsx';
import ProjectBriefDetails from './project/ProjectBriefDetails.jsx';
import QuizIntro from './quiz/QuizIntro.jsx';
import QuizQuestion from './quiz/QuizQuestion.jsx';
import QuizResultPass from './quiz/QuizResultPass.jsx';
import QuizResultFail from './quiz/QuizResultFail.jsx';
import ScenarioIntro from './scenario/ScenarioIntro.jsx';
import ScenarioPlay from './scenario/ScenarioPlay.jsx';
import TaskDecision from './evaluation/TaskDecision.jsx';
import TaskEvaluation from './evaluation/TaskEvaluation.jsx';

async function fetchGame(gameId = 9) {
  const res = await fetch(`http://localhost:4000/games/${gameId}`);
  if (!res.ok) throw new Error(`Failed to load game ${gameId}`);
  const raw = await res.json();
  return normalizeGameData(raw);
}

function normalizeGameData(data) {
  const letterToIndex = (s) => {
    if (typeof s !== 'string') return null;
    const m = s.trim().toUpperCase();
    const map = { A: 0, B: 1, C: 2, D: 3 };
    return map[m] ?? null;
  };

  const normalizeQuestion = (q) => {
    let choices = [];
    let correctIndex = null;

    if (Array.isArray(q.choices)) {
      choices = q.choices.slice(0, 4);
      correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : letterToIndex(q.correctAnswer);
    } else if (q.choices && typeof q.choices === 'object') {
      const order = ['A', 'B', 'C', 'D'];
      choices = order.map(k => q.choices[k]);
      correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : letterToIndex(q.correctAnswer);
    }

    if (!Array.isArray(choices) || choices.length !== 4) {
      choices = (choices || []).concat(Array(4)).slice(0, 4).map((v, i) => v ?? `Option ${i + 1}`);
    }
    if (correctIndex == null || correctIndex < 0 || correctIndex > 3) correctIndex = 0;

    return {
      questionId: q.questionId ?? 0,
      question: q.question ?? '',
      choices,
      correctIndex,
      explanation: q.explanation ?? ''
    };
  };

  const normalizeQuiz = (quiz) => {
    let timeSeconds = quiz.time ?? 0;
    if (quiz.timer) {
      const looksLikeMinutes = timeSeconds > 0 && timeSeconds <= 180 && (quiz.immediateFeedback === false || typeof quiz.quizTopic === 'string');
      if (looksLikeMinutes) timeSeconds = timeSeconds * 60;
    }

    const questions = Array.isArray(quiz.quizQuestions) ? quiz.quizQuestions.map(normalizeQuestion) : [];

    return {
      quizId: quiz.quizId ?? 0,
      quizLength: quiz.quizLength ?? questions.length,
      quizTopic: quiz.quizTopic ?? '',
      passRate: Math.max(0, Math.min(100, quiz.passRate ?? 0)),
      immediateFeedback: !!quiz.immediateFeedback,
      timer: !!quiz.timer,
      timeSeconds,
      quizQuestions: questions
    };
  };

  const personas = Array.isArray(data.personas) ? data.personas.map(p => ({
    personaId: p.personaId ?? 0,
    personaAvatar: p.personaAvatar ?? '',
    personaName: p.personaName ?? '',
    personaRole: p.personaRole ?? '',
    personaProfile: p.personaProfile ?? '',
    personaTraits: p.personaTraits ?? '',
    personaAttitude: p.personaAttitude ?? '',
    personaMotivation: p.personaMotivation ?? ''
  })) : [];

  const quizzes = Array.isArray(data.quizzes) ? data.quizzes.map(normalizeQuiz) : [];

  const scenarios = Array.isArray(data.scenarios) ? data.scenarios.map(s => ({
    scenarioId: s.scenarioId ?? 0,
    scenarioName: s.scenarioName ?? '',
    description: s.description ?? '',
    actionsToDo: s.actionsToDo ?? '',
    furtherConstraint: s.furtherConstraint ?? '',
    sampleQuestions: Array.isArray(s.sampleQuestions) ? s.sampleQuestions : [],
    sampleAnswer: s.sampleAnswer ?? ''
  })) : [];

  return {
    gameId: data.gameId ?? 0,
    createdBy: data.createdBy ?? null,
    gameTitle: data.gameTitle ?? '',
    gameDescription: data.gameDescription ?? '',
    scenarioNum: Number.isFinite(data.scenarioNum) ? data.scenarioNum : scenarios.length,
    personas,
    quizzes,
    scenarios
  };
}

function buildFlow(game) {
  const flow = [];

  flow.push({ key: 'BRIEF_INTRO', kind: 'BRIEF_INTRO' });
  flow.push({ key: 'BRIEF_DETAILS', kind: 'BRIEF_DETAILS' });

  game.quizzes.forEach((quiz, qi) => {
    flow.push({ key: `QUIZ_${qi}_INTRO`, kind: 'QUIZ_INTRO', qi });

    quiz.quizQuestions.forEach((_q, qj) => {
      flow.push({ key: `QUIZ_${qi}_Q${qj}`, kind: 'QUIZ_QUESTION', qi, qj });
    });

    flow.push({ key: `QUIZ_${qi}_RESULT`, kind: 'QUIZ_RESULT', qi });
  });

  game.scenarios.forEach((_s, si) => {
    flow.push({ key: `SCENE_${si}_INTRO`, kind: 'SCENARIO_INTRO', si });
    flow.push({ key: `SCENE_${si}_PLAY`, kind: 'SCENARIO_PLAY', si });
    flow.push({ key: `SCENE_${si}_DECISION`, kind: 'TASK_DECISION', si });
    flow.push({ key: `SCENE_${si}_EVALUATION`, kind: 'TASK_EVALUATION', si });
  });
  flow.push({key:"GAME_SUMMARY", kind:"GAME_SUMMARY"});
  flow.push({ key: 'BACK_DASHBOARD', kind: 'BACK_DASHBOARD' });
  
  return flow;
}

export default function Controller() {
  const { game_id } = useParams(); // match the route param
  const gameId = game_id ? Number(game_id) : 9;

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);
  const [quizOutcome, setQuizOutcome] = useState({});
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const g = await fetchGame(gameId);
        if (!cancelled) {
          setGame(g);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(e.message || 'Failed to load');
          setGame(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  const flow = useMemo(() => (game ? buildFlow(game) : []), [game]);

  useEffect(() => {
    setPageIndex(i => {
      if (flow.length === 0) return 0;
      return Math.min(i, flow.length - 1);
    });
  }, [flow.length]);


  const PAGES = useMemo(() => {
    const entries = flow.map((step, idx) => [step.key, idx]);
    return Object.fromEntries(entries);
  }, [flow]);

  const goNext = useCallback(() => {
    setPageIndex(i => Math.min(i + 1, flow.length - 1));
  }, [flow.length]);

  const goPrev = useCallback(() => {
    setPageIndex(i => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback((keyOrIndex) => {
    if (typeof keyOrIndex === 'number') {
      setPageIndex(() => Math.max(0, Math.min(keyOrIndex, flow.length - 1)));
    } else {
      const idx = flow.findIndex(s => s.key === keyOrIndex);
      if (idx >= 0) setPageIndex(idx);
    }
  }, [flow]);

  const onQuizComplete = useCallback(({ qi, correct, total, passRate }) => {
    const rate = total > 0 ? (correct / total) * 100 : 0;
    const passed = rate >= (passRate ?? (game?.quizzes?.[qi]?.passRate ?? 0));
    setQuizOutcome(prev => ({ ...prev, [qi]: { correct, total, passed }}));

    const resultKey = `QUIZ_${qi}_RESULT`;
    const idx = flow.findIndex(s => s.key === resultKey);
    if (idx >= 0) setPageIndex(idx);
  }, [flow, game]);

  const ctx = useMemo(() => ({
    pageIndex,
    flow,
    PAGES,
    goNext,
    goPrev,
    goTo,
    onQuizComplete,
    quizOutcome
  }), [pageIndex, flow, PAGES, goNext, goPrev, goTo, onQuizComplete, quizOutcome]);

  const stepTitles = useMemo(() => {
    return flow.map(s => {
      if (s.kind === 'BRIEF_INTRO') return 'Intro';
      if (s.kind === 'BRIEF_DETAILS') return 'Details';
      if (s.kind === 'QUIZ_INTRO') return `Quiz ${s.qi + 1} Intro`;
      if (s.kind === 'QUIZ_QUESTION') return `Q${s.qj + 1}`;
      if (s.kind === 'QUIZ_RESULT') return `Quiz ${s.qi + 1} Result`;
      if (s.kind === 'SCENARIO_INTRO') return `Scenario ${s.si + 1} Intro`;
      if (s.kind === 'SCENARIO_PLAY') return `Scenario ${s.si + 1} Play`;
      if (s.kind === 'TASK_DECISION') return `Scenario ${s.si + 1} Decision`;
      if (s.kind === 'TASK_EVALUATION') return `Scenario ${s.si + 1} Evaluation`;
      if (s.kind === 'GAME_SUMMARY') return 'Summary';
      return 'Done';
    });
  }, [flow]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>;
  if (!game || !flow.length) return <div style={{ padding: 24 }}>No steps available</div>;

  const safeIndex = Math.min(pageIndex, flow.length - 1);
  const step = flow[safeIndex];

  const renderStep = () => {
    switch (step.kind) {
      case 'BRIEF_INTRO':
        return <ProjectBriefIntro gameData={game} ctx={ctx} />;
      case 'BRIEF_DETAILS':
        return <ProjectBriefDetails gameData={game} ctx={ctx} />;
      case 'QUIZ_INTRO': {
        const quiz = game.quizzes[step.qi];
        return <QuizIntro gameData={game} ctx={{ ...ctx, qi: step.qi, quiz }} />;
      }
      case 'QUIZ_QUESTION': {
        const quiz = game.quizzes[step.qi];
        const question = quiz?.quizQuestions?.[step.qj];
        return (
          <QuizQuestion
            gameData={game}
            ctx={{ ...ctx, qi: step.qi, qj: step.qj, quiz, question }}
          />
        );
      }
      case 'QUIZ_RESULT': {
        const quiz = game.quizzes[step.qi];
        const outcome = ctx.quizOutcome[step.qi];
        const passed = outcome?.passed ?? false;
        return passed
          ? <QuizResultPass gameData={game} ctx={{ ...ctx, qi: step.qi, quiz, outcome }} />
          : <QuizResultFail gameData={game} ctx={{ ...ctx, qi: step.qi, quiz, outcome }} />;
      }
      case 'SCENARIO_INTRO': {
        const scenario = game.scenarios[step.si];
        return <ScenarioIntro gameData={game} ctx={{ ...ctx, si: step.si, scenario }} />;
      }
      case 'SCENARIO_PLAY': {
        const scenario = game.scenarios[step.si];
        return <ScenarioPlay gameData={game} ctx={{ ...ctx, si: step.si, scenario }} />;
      }
      case 'TASK_DECISION': {
        const scenario = game.scenarios[step.si];
        return <TaskDecision gameData={game} ctx={{ ...ctx, si: step.si, scenario }} />;
      }
      case 'TASK_EVALUATION': {
        const scenario = game.scenarios[step.si];
        return <TaskEvaluation gameData={game} ctx={{ ...ctx, si: step.si, scenario }} />;
      }
      case 'GAME_SUMMARY':
        return (
          <Navigate
            to="/game-summary"
            replace
            state={{
              gameId: game.gameId,
              gameData: game,
              quizOutcome: ctx.quizOutcome
            }}
          />
        );
      case 'BACK_DASHBOARD':
        return <Navigate to="/student-dashboard" replace />;
      default:
        return <div style={{ padding: 24 }}>Unknown step</div>;
    }
  };

  return (
  <>
    <Stepper current={safeIndex} steps={stepTitles} onJump={idx => ctx.goTo(idx)}/>
    <PageShell>
      {renderStep()}
    </PageShell>
  </>
  );
}
