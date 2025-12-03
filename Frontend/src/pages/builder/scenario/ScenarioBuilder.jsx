import React, { useState } from "react";
import "../../../styles/builder/scenario/ScenarioBuilder.css";
import { useNavigate, useLocation } from "react-router-dom";
import EducatorProgressSidebar from "../layout/EducatorProgressSidebar.jsx";

const ScenarioBuilder = () => {
  // single JSON object state
  const [scenarioIntro, setScenarioIntro] = useState({
    scenarioName: "",
    description: "",
    keyFacts: "",
    furtherConstraint: "",
  });

  const location = useLocation();
  const navigate = useNavigate();

  const previousPayload = location.state || {}; // All previous data from Scenario Builder

  const handleChange = (e) => {
    const { id, value } = e.target;
    setScenarioIntro((prev) => ({
      ...prev,
      [id]: value, // id must match state key
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fullPayload = {
      ...previousPayload,
      scenarios: [
        {
          scenarioId: 1,
          scenario_name: scenarioIntro.scenarioName,
          description: scenarioIntro.description,
          key_facts: scenarioIntro.keyFacts,
          further_constraint: scenarioIntro.furtherConstraint,
          time_limit: 0,
          primary_task: "",
          sample_questions: [],
          sample_answer: "",
          success_criteria: "",
          scoring_rubric: "",
          common_mistakes: ""
        }
      ]
    }

    console.log("Submitting scenario introduction:", fullPayload);
    // Navigate after saving, passing JSON object
    navigate("/action-tasks", { state: fullPayload });
  };

  return (
    <section className="scenario-intro-container">
      <EducatorProgressSidebar currentStep={3} />

      <div className="form-container">
        <h1 className="form-title">Scenario Builder</h1>
        <h1 className="form-title">Step 1: Scenario Introduction</h1>
        <h3 className="form-subtitle">
          Set the stage and give students the context they need before making the final decision.
        </h3>

        <div className="form-content">
          <form onSubmit={handleSubmit} className="scenario-intro-form">
            {/* Scenario Title */}
            <label htmlFor="scenarioName">Scenario Title</label>
            <input
              id="scenarioName"
              type="text"
              value={scenarioIntro.scenarioName}
              placeholder="Enter a short, descriptive title"
              onChange={handleChange}
              required
            />
            <small className="field-hint">
              Keep it concise and specific (e.g., “AI Feature Request at Launch”).
            </small>

            {/* Narrative Introduction */}
            <label htmlFor="description">Narrative Introduction</label>
            <textarea
              id="description"
              rows="8"
              value={scenarioIntro.description}
              placeholder="Describe the scenario in detail (who, what, when, why)."
              onChange={handleChange}
              required
            />
            <small className="field-hint">
              Provide the full setup students will read before taking action.
            </small>

            {/* Key Facts */}
            <label htmlFor="keyFacts">Key Facts</label>
            <textarea
              id="keyFacts"
              rows="6"
              value={scenarioIntro.keyFacts}
              placeholder={`• Budget: …\n• Time: …\n• Scope: …\n• Resources: …\n• Constraints: …`}
              onChange={handleChange}
              required
            />
            <small className="field-hint">
              Use bullet points for clarity. Include budget, time, scope, and constraints.
            </small>

            {/* Constraints & Assumptions */}
            <label htmlFor="furtherConstraint">Constraints & Assumptions</label>
            <textarea
              id="furtherConstraint"
              rows="4"
              value={scenarioIntro.furtherConstraint}
              placeholder="List any constraints, assumptions, or limitations."
              onChange={handleChange}
              required
            />

            {/* Save Button */}
            <button type="submit" className="save-button">
              Next: Context & Background
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ScenarioBuilder;
