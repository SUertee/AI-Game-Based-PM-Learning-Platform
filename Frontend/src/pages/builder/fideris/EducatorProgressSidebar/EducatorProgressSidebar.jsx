import React from "react";
import "../../../../styles/builder/EducatorProgressSidebar.css";
import Logo from "../../../../assets/logo.png";

const steps = [
  {
    label: "1. Game Creation",
    path: "/game-setup",
    description: "Define the AI role and traits for your learning game."
  },
  {
    label: "2. Quiz Configuration",
    path: "/quiz-config",
    description: "Set up questions, feedback options, and pass criteria."
  },
  {
    label: "3. Add Quiz Questions",
    path: "/add-quiz-questions",
    description: "Create multiple-choice questions to assess understanding."
  },
  {
    label: "4. Scenario Creation",
    path: "/scenario-setup",
    description: "Craft realistic situations with objectives and constraints"
  },
  {
    label: "5. Task & Evaluation",
    path: "/task-eval",
    description: "Design tasks, sample answers, and scoring rules."
  },
  {
    label: "6. Review & Publish",
    path: "/review-publish",
    description: "Preview all content and finalize your game."
  }
];

const EducatorProgressSidebar = ({ currentStep }) => {
  return (
    <div className="sidebar-container">
      <div className="sidebar-logo-wrap">
        <img src={Logo} alt="App Logo" className="sidebar-logo" />
      </div>

      <div className="sidebar-content">
        <h3 className="sidebar-title">Progress Check</h3>
        <hr className="sidebar-divider" />

        <ul className="sidebar-steps">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <li
                key={step.label}
                className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
              >
                <span>{step.label}</span>
                <p className="step-description">{step.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div> 
  );
};

export default EducatorProgressSidebar;
