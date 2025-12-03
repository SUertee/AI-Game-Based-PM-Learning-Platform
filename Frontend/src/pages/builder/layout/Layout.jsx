import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./EducatorProgressSidebar.jsx";

import Logo from "../../../assets/logo.png";
import "../../../styles/builder/layout.css";
import "../../../styles/builder/EducatorProgressSidebar.css";

const steps = [
  { key: "persona", title: "Persona creation", desc: "Choose AI roles, assign trait variants, and preview persona cards.", to: "/" },
  { key: "quiz", title: "Quiz creation", desc: "Build quizzes with questions, answer types, pass threshold, quiz options.", to: "/quiz-builder" },
  { key: "scenarios", title: "Scenario creation", desc: "Define scenario title, objectives, constraints, context, and AI messages.", to: "/scenarios" },
  { key: "tasks", title: "Task and evaluation", desc: "Set tasks with rationale, sample answers, criteria, and scoring rules.", to: "/tasks" },
  { key: "review", title: "Review & publish", desc: "Preview all game content and edit before publishing.", to: "/review" },
];

export default function Layout() {
  const { pathname } = useLocation();
  const activeIndex = Math.max(0, steps.findIndex(s => s.to === pathname));
  return (
    <div className="app">
        <div className="educator-sidebar1" style={{backgroundColor: "var(--secondary)"}}>
          <img src={Logo} alt="App Logo" className="sidebar-logo" />
          <Sidebar currentStep={activeIndex} />
        </div>
      {/* <Sidebar --this is the original sidebar, replaced later by fideris's design
        currentStep={0} 
        // logoSrc="/personai-logo.png" // place your uploaded image at /public/personai-logo.png
        // brand="PersonAI"
        // panelTitle="Progress Check"
        // steps={steps}
        // activeIndex={activeIndex}
      /> */}
      <main className="main">
        <div className="content-shell">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
