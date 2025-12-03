// src/pages/ProjectBriefDetails.jsx
import React, { useMemo, useState } from "react";
import "../../../styles/game/project/Cards.css";
import GPLayout from "../layout/GPLayout.jsx";
import "../../../styles/game/layout/GamePlay.css";

// Shared components/utilities
import PersonaCard from "../../../components/PersonaCard.jsx";
import { mapPersonas } from "../../../utils/persona.js";

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

// --- Helpers: robustly parse Time/Scope/Budget from DB description ---
// Accepts: object, JSON string, or double-encoded JSON string
function extractBriefFromDB(desc) {
  if (!desc) {
    return { time: "", scope: "", budget: "" };
  }

  let timePeriod = null;
  let scopeStatement = null;
  let budget = null;

  // 如果已经是对象,直接提取
  if (typeof desc === "object" && !Array.isArray(desc)) {
    timePeriod = desc.time_period ?? desc.timePeriod ?? "";
    scopeStatement = desc.scope_statement ?? desc.scopeStatement ?? "";
    budget = desc.budget ?? desc.projectBudget ?? "";
    return { time: timePeriod, scope: scopeStatement, budget };
  }

  // 如果是字符串,尝试多种解析方法
  if (typeof desc === 'string') {
    try {
      // 方法1: 直接解析JSON
      const parsed = JSON.parse(desc);
      timePeriod = parsed.time_period ?? parsed.timePeriod ?? "";
      scopeStatement = parsed.scope_statement ?? parsed.scopeStatement ?? "";
      budget = parsed.budget ?? parsed.projectBudget ?? "";
    } catch (e) {
      try {
        // 方法2: 替换转义的反斜杠再解析
        const cleaned = desc.replace(/\\\"/g, '"');
        const parsed = JSON.parse(cleaned);
        timePeriod = parsed.time_period ?? parsed.timePeriod ?? "";
        scopeStatement = parsed.scope_statement ?? parsed.scopeStatement ?? "";
        budget = parsed.budget ?? parsed.projectBudget ?? "";
      } catch (e2) {
        try {
          // 方法3: 双重解析(处理double-encoded JSON)
          const once = JSON.parse(desc);
          if (typeof once === "string") {
            const twice = JSON.parse(once);
            timePeriod = twice.time_period ?? twice.timePeriod ?? "";
            scopeStatement = twice.scope_statement ?? twice.scopeStatement ?? "";
            budget = twice.budget ?? twice.projectBudget ?? "";
          }
        } catch (e3) {
          // 方法4: 使用正则表达式直接提取字段
          const timeMatch = desc.match(/"time_period"\s*:\s*"([^"]+)"/);
          const scopeMatch = desc.match(/"scope_statement"\s*:\s*"([^"]+)"/);
          const budgetMatch = desc.match(/"budget"\s*:\s*"([^"]+)"/);
          
          if (timeMatch) timePeriod = timeMatch[1];
          if (scopeMatch) scopeStatement = scopeMatch[1];
          if (budgetMatch) budget = budgetMatch[1];

          // 方法5: 尝试旧格式 'Budget:', 'Time:', 'Scope:'
          if (!timePeriod && !scopeStatement && !budget) {
            const budgetOldMatch = desc.match(/Budget:\s*([^\n]+)/);
            const timeOldMatch = desc.match(/Time:\s*([^\n]+)/);
            const scopeOldMatch = desc.match(/Scope:\s*([^\n]+)/);
            
            if (timeOldMatch) timePeriod = timeOldMatch[1].trim();
            if (scopeOldMatch) scopeStatement = scopeOldMatch[1].trim();
            if (budgetOldMatch) budget = budgetOldMatch[1].trim();
          }
        }
      }
    }
  }

  if (!timePeriod && !scopeStatement && !budget) {
    console.warn("[ProjectBriefDetails] Could not parse description. First 120 chars:",
      typeof desc === "string" ? desc.slice(0, 120) : desc
    );
  }

  return { 
    time: timePeriod || "", 
    scope: scopeStatement || "", 
    budget: budget || "" 
  };
}

export default function ProjectBriefDetails({ gameData, ctx }) {
  const [open, setOpen] = useState({
    scope: true,
    time: false,
    budget: false,
  });
  
  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const brief = useMemo(() => {
  // Use gameData.gameDescription as the single source for the brief.
  const parsed = extractBriefFromDB(gameData?.gameDescription);
  return {
    title: gameData?.gameTitle || "Project Brief",
    time: parsed.time,
    scope: parsed.scope,
    budget: parsed.budget,
  };
}, [gameData?.gameTitle, gameData?.gameDescription]);

  // Personas from DB only (no fallbacks)
  const personas = useMemo(() => mapPersonas(gameData?.personas || []), [gameData?.personas]);

  return (
    <GPLayout>
      <div className="gp-wrap">
        <div className="gp-grid">
          {/* Left: Brief */}
          <section className="gp-left">
            <h2 className="gp-title">{brief.title}</h2>

            <section className="info-list" aria-label="Project brief details">
              {/* Scope Statement */}
              <div className="info-group" key="scope">
                <div className="info-row">
                  <span className="info-row-title" id="label-scope">
                    Scope Statement
                  </span>
                  <button
                    type="button"
                    className="info-row-icon"
                    aria-expanded={!!open.scope}
                    aria-controls="panel-scope"
                    onClick={() => toggle("scope")}
                    title={open.scope ? "Collapse" : "Expand"}
                  >
                    <ChevronRight />
                  </button>
                </div>
                {open.scope && (
                  <div id="panel-scope" className="info-box" role="region" aria-labelledby="label-scope">
                    <p className="prewrap" style={{ margin: 0 }}>{brief.scope || "No scope statement provided."}</p>
                  </div>
                )}
              </div>

              {/* Time Period */}
              <div className="info-group" key="time">
                <div className="info-row">
                  <span className="info-row-title" id="label-time">
                    Time Period
                  </span>
                  <button
                    type="button"
                    className="info-row-icon"
                    aria-expanded={!!open.time}
                    aria-controls="panel-time"
                    onClick={() => toggle("time")}
                    title={open.time ? "Collapse" : "Expand"}
                  >
                    <ChevronRight />
                  </button>
                </div>
                {open.time && (
                  <div id="panel-time" className="info-box" role="region" aria-labelledby="label-time">
                    <p className="prewrap" style={{ margin: 0 }}>{brief.time || "No time period provided."}</p>
                  </div>
                )}
              </div>

              {/* Budget */}
              <div className="info-group" key="budget">
                <div className="info-row">
                  <span className="info-row-title" id="label-budget">
                    Budget
                  </span>
                  <button
                    type="button"
                    className="info-row-icon"
                    aria-expanded={!!open.budget}
                    aria-controls="panel-budget"
                    onClick={() => toggle("budget")}
                    title={open.budget ? "Collapse" : "Expand"}
                  >
                    <ChevronRight />
                  </button>
                </div>
                {open.budget && (
                  <div id="panel-budget" className="info-box" role="region" aria-labelledby="label-budget">
                    <p className="prewrap" style={{ margin: 0 }}>{brief.budget || "No budget information provided."}</p>
                  </div>
                )}
              </div>
            </section>

            <div style={{ marginTop: 16 }}>
              <button className="btn primary" onClick={() => ctx.goNext()}>
                Next
              </button>
            </div>
          </section>

          {/* Right: Teams & Stakeholders with horizontal scroller */}
          <aside className="gp-right">
            <h3 className="gp-subtitle">Teams and Stakeholders</h3>

            <div className="brief-block">
              <div className="persona-scroller">
                <div className="persona-track">
                  {personas.length === 0 ? (
                    <div className="muted" style={{ padding: 12 }}>
                      No personas found in the database.
                    </div>
                  ) : (
                    personas.map((p, i) => (
                      <PersonaCard
                        key={`persona-${i}-${p.name}`}
                        name={p.name}
                        role={p.role}
                        avatar={p.avatar}
                        profile={p.profile}
                        traits={p.traits}
                        motivation={p.motivation}
                        attitude={p.attitude}
                        size="sm"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </GPLayout>
  );
}
