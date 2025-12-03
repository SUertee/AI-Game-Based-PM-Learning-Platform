// src/pages/Game_Harry/ScenarioPlay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../../styles/game/common/GamePlay.css";
import "../../../styles/game/common/ScenarioPlay.css";

import PersonaCard from "../../../components/PersonaCard.jsx";
import AIChat from "../../../components/AIChat.jsx";

import { mapPersonas } from "../../../utils/persona.js";

export default function ScenarioPlay({ gameData, ctx }) {
  const listRef = useRef(null);

  // From Controller ctx: which scenario index we're on, and the scenario object itself
  const { si = 0, scenario: scenarioInCtx, goNext } = ctx || {};

  // Prefer ctx.scenario; fallback to gameData.scenarios[si]
  const scenario = useMemo(
    () => scenarioInCtx ?? gameData?.scenarios?.[si] ?? {},
    [scenarioInCtx, gameData, si]
  );

  const personas = useMemo(() => mapPersonas(gameData?.personas), [gameData?.personas]);

  const [selectedPersona, setSelectedPersona] = useState(null);

  // Optional: widen layout via a body class your CSS might use
  useEffect(() => {
    document.body.classList.add("shell-wide");
    return () => document.body.classList.remove("shell-wide");
  }, []);

  return (
    <div className="gp-wrap scenario-play-page">
      <div className="scchat-card">
        <header className="scchat-header">
          <h1>{scenario?.scenarioName || "Scenario"}</h1>
          <p>
            Timed team discussion: Ask clarifying questions. When time ends,
            you’ll provide your final decision.
          </p>
        </header>

        <div className="scchat-body">
          {/* Personas Sidebar */}
          <aside className="scchat-personas">
            <h2>Personas</h2>
            <div className="persona-list" ref={listRef}>
              {personas.map((p, i) => {
                // Ensure a unique, stable key and HTML id even if fields are missing/duplicated
                const key = p.id ?? `idx_${i}`;
                const htmlId = `persona_${key}`.replace(/[^a-zA-Z0-9_-]/g, "_");
                const isOpen = selectedPersona?.name === p.name;

                return (
                  <div key={key} className={`persona-item ${isOpen ? "is-open" : ""}`}>
                    {!isOpen ? (
                      <div className="persona-brief-card">
                        <div className="persona-brief-name">{p.name || "Unknown"}</div>
                        <div className="persona-brief-row">
                          <div className="persona-brief-role">{p.role}</div>
                          <button
                            className="persona-expand"
                            type="button"
                            onClick={() => setSelectedPersona(p)}
                            aria-expanded="false"
                            aria-controls={htmlId}
                          >
                            Chat
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="persona-inline" id={htmlId}>
                        <button
                          className="persona-hide"
                          type="button"
                          onClick={() => setSelectedPersona(null)}
                          aria-expanded="true"
                          aria-label={`Hide ${p.name || "persona"}`}
                        >
                          Hide
                        </button>

                        <PersonaCard
                          name={p.name}
                          role={p.role}
                          avatar={p.avatar}
                          profile={p.profile}
                          traits={p.traits}
                          motivation={p.motivation}
                          attitude={p.attitude}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="scchat-divider" aria-hidden />

          {/* Chat Panel */}
          <AIChat
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
            onEndDiscussion={goNext}
            gameData={gameData}
            // You can pass more context if AIChat needs it:
            // scenarioBrief={scenario?.description}
            // projectBrief={{ title: gameData?.gameTitle, ... }}
          />
        </div>
      </div>
    </div>
  );
}
