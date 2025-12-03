import React, { useEffect, useState } from "react";
import GPLayout from "../sens/components/GPLayout.jsx";

import "../../../styles/game/common/GamePlay.css";
import "../../../styles/game/common/TaskDecision.css";

export default function TaskDecision({ gameData, ctx }) {
  const { goNext, goPrev, si, scenario, pageIndex } = ctx;

  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");

  const canSubmit = decision.trim() && rationale.trim();

  const storageKey = `pmGame:decision:${gameData?.gameId ?? "0"}:${si ?? "0"}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      if (saved?.decision) setDecision(saved.decision);
      if (saved?.rationale) setRationale(saved.rationale);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ decision, rationale }));
    } catch {}
  }, [decision, rationale, storageKey]);

  const handleSubmit = () => {
    if (!canSubmit) {
      alert("⚠️ Please fill in both Decision and Rationale before submitting.");
      return;
    }
    goNext();
  };

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

  return (
    <GPLayout>
      <div className="gp-wrap task-decision-page">
        {/* Main Card */}
        <section className="td-card">
          <h1 className="td-title">Final Decision and Rationale</h1>
          <p className="td-subtitle">
            Provide your decision to justify your approach.
          </p>



          {scenario && (
            <div className="td-scenario-brief">
              <div className="td-scenario-header">
                <label htmlFor="td-rationale" className="td-label">
                  Scenario Background:
                </label>
                <span className="td-scenario-name">
                  {scenario?.scenarioName
                    ? scenario.scenarioName
                    : `Scenario ${Number(si) + 1}`}
                </span>
              </div>

              
              {/* Description — split into sentences or newlines */}
              {scenario.description && (
                <div className="td-scenario-desc">
                  {splitLines(scenario.description).map((line, i) => (
                    <p key={i} style={{ margin: "0 0 8px 0" }}>
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {/* Further constraints — split into bullet points */}
              {scenario.furtherConstraint && (
                <div className="td-scenario-constraint">
                  <strong>Constraint:</strong>
                  <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    {splitLines(scenario.furtherConstraint).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}


          <div className="td-form">
            <label htmlFor="td-decision" className="td-label">Decision</label>
            <textarea
              id="td-decision"
              className="td-input"
              placeholder="Write your decision in the space provided"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              rows={4}
            />

            <label htmlFor="td-rationale" className="td-label">Rationale</label>
            <textarea
              id="td-rationale"
              className="td-input"
              placeholder="Write your rational"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={7}
            />
          </div>

          <div className="td-actions">
            <div className="td-actions-right">
              <button
                className="btn tip"
                type="button"
                onClick={() =>
                  alert(
                    "Tips:\n• Consider scope, schedule, budget\n• Stakeholder expectations\n• Risk/Impact matrix\n• Feasibility within current sprint"
                  )
                }
              >
                Show tips
              </button>

              <button
                className="btn gold"
                type="button"
                onClick={handleSubmit}
                title={
                  canSubmit
                    ? "Submit for Evaluation"
                    : "Please fill Decision and Rationale first"
                }
              >
                Submit for Evaluation
              </button>
            </div>
          </div>
        </section>
      </div>
    </GPLayout>
  );
}
