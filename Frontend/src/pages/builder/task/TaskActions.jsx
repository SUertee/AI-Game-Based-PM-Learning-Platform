import React, { useState } from "react";
import "../../../styles/builder/task/TaskActions.css";
import EducatorProgressSidebar from "../layout/EducatorProgressSidebar.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const TaskActions = () => {
  const [primaryTask, setPrimaryTask] = useState("");
  const [timeLimit, setTimeLimit] = useState("");

  const location = useLocation(); // JSON object from Scenario Introduction
  const navigate = useNavigate();

  const previousPayload = location.state || {}; // fallback to empty object

  const handleSubmit = (e) => {
    e.preventDefault();

    if (primaryTask.trim().length < 10) {
      alert("Please provide a more detailed primary task (at least 10 characters).");
      window.scrollTo(0, 0);
      return;
    }

    if (timeLimit && (!/^\d+$/.test(timeLimit) || Number(timeLimit) <= 0)) {
      alert("Time limit must be a positive number (in minutes).");
      window.scrollTo(0, 0);
      return;
    }

    const fullPayload = {
      ...previousPayload,
      scenarios: previousPayload.scenarios
        ? previousPayload.scenarios.map((scenario) => ({
            ...scenario,
            primary_task: primaryTask.trim(), 
            time_limit: timeLimit ? Number(timeLimit) : 0,
          }))
        : [
            {
              ...previousPayload.scenarios[0],
              primary_task: primaryTask.trim(), 
              time_limit: timeLimit ? Number(timeLimit) : 0,
            },
          ],
    };

    console.log("Full Scenario Payload:", fullPayload);

    // Navigate to next page, passing the updated JSON
    navigate("/expected-outcomes", { state: fullPayload });
  };

  return (
    <section className="scenario-actions-container">
      <EducatorProgressSidebar currentStep={4} />

      <div className="form-container">
        <h1 className="form-title">Scenario Builder</h1>
        <h1 className="form-title">Step 2: Actions / Tasks</h1>
        <h3 className="form-subtitle">
          Define what the student must do in response to the scenario.
        </h3>

        <div className="form-content">
          <form onSubmit={handleSubmit} className="scenario-actions-form">
            {/* Primary Task */}
            <label htmlFor="primaryTask">Primary Task (Main Objective)</label>
            <textarea
              id="primaryTask"
              rows="4"
              value={primaryTask}
              placeholder="Describe the main objective the student must achieve."
              onChange={(e) => setPrimaryTask(e.target.value)}
              required
            />

            {/* Time Limit */}
            <label htmlFor="timeLimit">Time Limit (Optional)</label>
            <input
              id="timeLimit"
              type="Number"
              value={timeLimit}
              placeholder="Enter time in minutes (e.g. 120)"
              onChange={(e) => setTimeLimit(e.target.value)}
            />

            {/* Save Button */}
            <button type="submit" className="save-button">
              Next: Expected Outcomes
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default TaskActions;
