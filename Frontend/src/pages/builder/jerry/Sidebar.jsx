import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ logoSrc, brand, panelTitle, steps, activeIndex = 0 }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo-wrap">
          {/* If no image yet, the box renders a neutral placeholder */}
          {logoSrc ? <img src={logoSrc} alt={`${brand} logo`} /> : <div className="logo-placeholder" />}
        </div>
        <div className="brand-text">{brand}</div>
      </div>

      <div className="progress-card">
        <div className="progress-title">{panelTitle}</div>
        <ol className="step-list">
          {steps.map((s, i) => (
            <li key={s.key} className={`step ${i === activeIndex ? "active" : ""}`}>
              <NavLink to={s.to} className="step-link">
                <div className="step-line1">
                  <span className="step-index">{i + 1}.</span>
                  <span className="step-title">{s.title}</span>
                </div>
                <div className="step-desc">{s.desc}</div>
              </NavLink>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
