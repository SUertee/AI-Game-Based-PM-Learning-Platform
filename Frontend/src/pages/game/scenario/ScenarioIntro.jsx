import React, { useMemo, useState, useEffect } from "react";
import GPLayout from "../layout/GPLayout.jsx";
import "../../../styles/game/layout/GamePlay.css";

function ChevronRight({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ScenarioIntro({ gameData, ctx, si: siProp, scenario: scenarioProp, autoAdvance = false }) {
  const si = useMemo(() => {
    if (Number.isFinite(siProp)) return siProp;
    if (Number.isFinite(ctx?.si)) return ctx.si;
    return 0;
  }, [siProp, ctx?.si]);

  const scenario = useMemo(() => {
    return (
      scenarioProp ||
      gameData?.scenarios?.[si] || {
        scenarioId: 0,
        scenarioName: `Scenario ${si + 1}`,
        description: "",
        actionsToDo: "",
        furtherConstraint: "",
        sampleQuestions: [],
        sampleAnswer: "",
      }
    );
  }, [scenarioProp, gameData, si]);

  const totalScenarios = gameData?.scenarios?.length || 0;
  const gameTitle = gameData?.gameTitle || "Game";

  const [open, setOpen] = useState({
    intro: true,
    actions: false,
    consider: false,
    samples: false,
  });
  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  // Replace your current splitLines with this
  const splitLines = (text) => {
    let s = String(text ?? '');

    // 1) decode escaped newlines first: "...\n..." -> actual line break
    s = s.replace(/\\n/g, '\n').replace(/\r/g, '');

    // 2) choose a splitter:
    //    - if real newlines exist, split on them
    //    - otherwise split by sentence boundaries
    const parts = (s.includes('\n'))
      ? s.split(/\n+/)
      : s.split(/(?<=[.?!])\s+/);

    return parts.map(t => t.trim()).filter(Boolean);
  };



  const handleStart = () => {
    if (typeof ctx?.goNext === "function") ctx.goNext();
  };

  return (
    <GPLayout>
      <div className="gp-wrap scenario-intro-page">
        <header className="gp-header" aria-label="Scenario header" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>
            {gameTitle} — Scenario {si + 1}
            {totalScenarios ? ` / ${totalScenarios}` : ""}
          </h2>
          <p style={{ marginTop: 6, opacity: 0.8, textAlign: "center" }}>{scenario.scenarioName}</p>
        </header>

        <section className="info-list" aria-label="Scenario details">
          {/* 1) Introduction / Description */}
          <div className="info-group" key="intro">
            <div className="info-row">
              <span className="info-row-title" id="label-intro">
                Scenario Introduction
              </span>
              <button
                type="button"
                className="info-row-icon"
                aria-expanded={!!open.intro}
                aria-controls="panel-intro"
                onClick={() => toggle("intro")}
                title={open.intro ? "Collapse" : "Expand"}
              >
                <ChevronRight />
              </button>
            </div>
            {open.intro && (
              <div id="panel-intro" className="info-box" role="region" aria-labelledby="label-intro">
                {splitLines(scenario.description).map((line, i) => (
                  <p key={i} style={{ margin: "0 0 8px 0" }}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* 2) Actions to do */}
          <div className="info-group" key="actions">
            <div className="info-row">
              <span className="info-row-title" id="label-actions">
                Actions to do
              </span>
              <button
                type="button"
                className="info-row-icon"
                aria-expanded={!!open.actions}
                aria-controls="panel-actions"
                onClick={() => toggle("actions")}
                title={open.actions ? "Collapse" : "Expand"}
              >
                <ChevronRight />
              </button>
            </div>
            {open.actions && (
              <div id="panel-actions" className="info-box" role="region" aria-labelledby="label-actions">
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {splitLines(scenario.actionsToDo).length > 0 ? (
                    splitLines(scenario.actionsToDo).map((line, i) => <li key={i}>{line}</li>)
                  ) : (
                    <li>No specific actions provided.</li>
                  )}
                </ol>
              </div>
            )}
          </div>

          {/* 3) Further considerations / constraints */}
          <div className="info-group" key="consider">
            <div className="info-row">
              <span className="info-row-title" id="label-consider">
                Further considerations
              </span>
              <button
                type="button"
                className="info-row-icon"
                aria-expanded={!!open.consider}
                aria-controls="panel-consider"
                onClick={() => toggle("consider")}
                title={open.consider ? "Collapse" : "Expand"}
              >
                <ChevronRight />
              </button>
            </div>
            {open.consider && (
              <div id="panel-consider" className="info-box" role="region" aria-labelledby="label-consider">
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {splitLines(scenario.furtherConstraint).length > 0 ? (
                    splitLines(scenario.furtherConstraint).map((line, i) => <li key={i}>{line}</li>)
                  ) : (
                    <li>No further considerations.</li>
                  )}
                </ul>
              </div>
            )}
          </div>

        </section>

        <div className="row gap" style={{ marginTop: 20 }}>
          <button type="button" className="btn primary" onClick={handleStart}>
            Start Scenario
          </button>
        </div>
      </div>
    </GPLayout>
  );
}
