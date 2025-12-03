// src/components/TopSteps.jsx
import React from "react";

/** Inline icons (kept here so component is self-contained) */
function CheckIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r="22" fill="#6EA2C8" />
      <path
        d="M14 22.5l5 5 11-11"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


/**
 * TopSteps
 * Props:
 * - steps: [{ title, sub }]
 * - current: number (1-based index for the active step)
 * - onStepClick?: (index) => void  (optional)
 *
 * Uses the SAME class names your existing CSS expects:
 * .top-steps, .top-tooltips, .top-tip, .top-track, .top-step, .top-line
 */
export default function TopSteps({ steps = [], current = 1, onStepClick }) {
  return (
    <section className="top-steps" aria-label="Scenario steps">
      {/* Tooltips row */}
      <div className="top-tooltips">
        {steps.map((s, i) => (
          <div className="top-tip" key={`${s.title}-${i}`}>
            <div className="top-tip-title">{s.title}</div>
            <div className="top-tip-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Track with steps + lines */}
      <div className="top-track" role="list">
        {steps.map((_, i) => {
          const idx = i + 1;
          const isDone = idx < current;
          const isCurrent = idx === current;

          const StepContent = () =>
            isDone ? <CheckIcon /> : <div className="top-step">{idx}</div>;

          return (
            <React.Fragment key={`step-${idx}`}>
              <button
                type="button"
                className={`top-step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
                role="listitem"
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${idx}: ${steps[i]?.title || ""}`}
                onClick={() => onStepClick && onStepClick(idx)}
                // Use the number or check as visual only; CSS targets .top-step
              >
                {/* Render number if not done; check icon if done */}
                {isDone ? <CheckIcon /> : idx}
              </button>

              {/* Connector line (skip after last) */}
              {i < steps.length - 1 && <div className="top-line" aria-hidden />}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
