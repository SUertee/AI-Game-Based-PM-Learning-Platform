import React, {useEffect, useRef, useState} from "react";
import GPLayout from "../layout/GPLayout.jsx";
import "../../../styles/game/layout/GamePlay.css";
import { evaluateTask } from "../../../services/ollama/TaskEvaluationService.js";

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

export default function TaskEvaluation({ gameData, ctx }) {
  // ctx is expected to include si and scenario
  const si = ctx?.si ?? 0;
  const scenario = ctx?.scenario ?? (gameData?.scenarios?.[si] ?? {});

  const projectBrief = {
    title: gameData.gameTitle,
    description: gameData.gameDescription
  };

  // Read the saved decision/rationale from the same sessionStorage key used by TaskDecision
  const storageKey = `pmGame:decision:${gameData?.gameId ?? "0"}:${si ?? "0"}`;
  const [decision, setDecision] = useState(null);
  const [rationale, setRationale] = useState(null);

  const [open, setOpen] = useState({ eval: true, sample: false });
  const [loading, setLoading] = useState(false);
  const [evalText, setEvalText] = useState("");
  const [sampleText, setSampleText] = useState("");
  const [markText, setMarkText] = useState("");
  const [markScore, setMarkScore] = useState(null);
  const [error, setError] = useState(null);

  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved && (saved.decision || saved.rationale)) {
        setDecision(saved.decision ?? "");
        setRationale(saved.rationale ?? "");
      } else {
        setDecision(null);
        setRationale(null);
      }
    } catch (e) {
      setDecision(null);
      setRationale(null);
    }
  }, [storageKey]);

  const ranOnce = useRef(false);
  useEffect(() => {
    // only run evaluation when we have both decision and rationale
    if (ranOnce.current) return;
    if (decision == null || rationale == null) return; // wait until loaded

    ranOnce.current = true;

    const runEval = async () => {
      setLoading(true);
      setError(null);

      // Build a scenario brief that the evaluation service expects
      const sampleAnswer = scenario.sampleAnswer === "" || scenario.sampleAnswer === null ? null : scenario.sampleAnswer;
      const scenarioBrief = {
        name: scenario.scenarioName,
        description: scenario.description,
        actionsToDo: scenario.actionsToDo,
        furtherConstraint: scenario.furtherConstraint,
        sampleAnswer: sampleAnswer
      };

      try {
        const res = await evaluateTask({ decision, rationale, projectBrief, scenarioBrief });

        if (res && res.ok) {
          setEvalText(res.evalRaw || "");
          setSampleText(res.sampleRaw || "");
          setMarkText(res.markRaw || "");

          // Try to extract an integer score like "Overall Mark: 70/100"
          const match = (res.markRaw || "").match(/Overall Mark:\s*(\d+)\s*\/\s*100/i);
          if (match) {
            setMarkScore(parseInt(match[1], 10));
          } else {
            setMarkScore(null);
          }

          // --------------------------
          // Persist evaluation to localStorage (so GameSummary can read it)
          // --------------------------
          try {
            const gId = gameData?.gameId ?? "0";
            const key = `pmGame:${gId}:task:${si}`;

            // prefer the parsed numeric mark if available, otherwise null
            const parsedMark = match ? parseInt(match[1], 10) : null;

            const payload = {
              si,
              mark: parsedMark,                      // number or null
              evalText: res.evalRaw || "",           // the detailed evaluation
              sampleText: res.sampleRaw || "",
              markText: res.markRaw || "",
              timestamp: Date.now(),
              hasStored: true
            };

            localStorage.setItem(key, JSON.stringify(payload));
            console.log("Saved evaluation to localStorage:", key, payload);
          } catch (e) {
            console.warn("Failed to save evaluation to localStorage", e);
            // non-fatal — we still display the evaluation
          }
        } else {
          setError((res && res.error) || "Evaluation failed: unknown error");
        }
      } catch (e) {
        console.error(e);
        setError(e.message || "Evaluation failed: exception thrown");
      }

      setLoading(false);
    };

    runEval();
  }, [decision, rationale, scenario, gameData, si, projectBrief]);

  // Helper to jump back to the decision step if nothing is saved
  const goToDecision = () => {
    // Controller uses keys like `SCENE_${si}_DECISION`
    if (typeof ctx?.goTo === 'function') ctx.goTo(`SCENE_${si}_DECISION`);
  };

  return (
      <GPLayout>
        <div className="gp-wrap scenario-intro-page">
          {/* If decision/rationale not found, show helpful message */}
          {decision == null || rationale == null ? (
              <section className="info-list" aria-label="Missing decision">
                <h2>Decision not found</h2>
                <p>
                  We couldn't find a saved Decision and Rationale for this scenario. Please go back to the
                  Decision page and submit your answer first so it can be evaluated.
                </p>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" type="button" onClick={goToDecision}>
                    Go to Decision
                  </button>
                </div>
              </section>
          ) : (
              <>
                {loading && <p>⏳ Evaluating your decision...</p>}
                {error && <p className="error">❌ {error}</p>}
                {!loading && !error && (
                    <section className="info-list" aria-label="Evaluation details">
                      {/*Display the mark or the text if we cant parse the mark*/}
                      {markScore !== null ? (
                          <h2 style={{color: markScore >= 50 ? "green" : "red"}}>
                            Your Mark: {markScore}/100
                          </h2>
                      ) : (
                          <p>{markText}</p>
                      )}

                      {/* Evaluation Tab */}
                      <div className="info-group">
                        <div className="info-row">
                          <span className="info-row-title">Evaluation Results</span>
                          <button
                              type="button"
                              className="info-row-icon"
                              aria-expanded={open.eval}
                              onClick={() => toggle("eval")}
                          >
                            <ChevronRight/>
                          </button>
                        </div>
                        {open.eval && (
                            <div className="info-box">
                              {String(evalText).split("\n").map((line, idx) => {
                                if (/Recommendations:/i.test(line)) return <strong key={idx}>{line}</strong>;
                                if (/^\- /.test(line)) return <li key={idx}>{line.replace("- ", "")}</li>;
                                return <p key={idx}>{line}</p>;
                              })}
                            </div>
                        )}
                      </div>


                      {/* Sample Answer Tab */}
                      <div className="info-group">
                        <div className="info-row">
                          <span className="info-row-title">Sample Answer</span>
                          <button
                              type="button"
                              className="info-row-icon"
                              aria-expanded={open.sample}
                              onClick={() => toggle("sample")}
                          >
                            <ChevronRight/>
                          </button>
                        </div>
                        {open.sample && (
                            <div className="info-box">
                              {String(sampleText).split("\n").map((line, idx) => (
                                  <p key={idx}>{line}</p>
                              ))}
                            </div>
                        )}
                      </div>

                      {/* Finish Review Button */}
                      <div className="row gap" style={{ marginTop: 20 }}>
                        <button 
                          type="button" 
                          className="btn primary" 
                          onClick={() => ctx?.goNext && ctx.goNext()}
                        >
                          Finish Review
                        </button>
                      </div>
                    </section>
                )}
              </>
          )}
        </div>
      </GPLayout>
  );
}
