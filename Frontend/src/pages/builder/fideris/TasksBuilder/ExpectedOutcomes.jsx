import React, { useState } from "react";
import "../../../../styles/builder/ExpectedOutcomes.css";
import { useNavigate, useLocation } from "react-router-dom";
import EducatorProgressSidebar from "../EducatorProgressSidebar/EducatorProgressSidebar";

const ExpectedOutcomes = () => {
  const [successCriteria, setSuccessCriteria] = useState("");
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [scoringRubric, setScoringRubric] = useState("");
  const [commonMistakes, setCommonMistakes] = useState("");
  const [sampleQuestions, setSampleQuestions] = useState([]);
  const [sampleQuestionsText, setSampleQuestionsText] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // previous data from earlier steps
    const previousPayload = location.state || {};

    // --- Format scenarios properly ---
    const formattedScenarios = previousPayload.scenarios?.map((scenario, idx) => ({
      scenarioId: 1,
      scenarioName: scenario.scenario_name || "",
      description: scenario.description || "",
      sampleAnswer: sampleAnswer || "",
      sampleQuestions: sampleQuestions,
      keyFacts: scenario.key_facts || "",
      furtherConstraint: scenario.further_constraint || "",
      timeLimit: scenario.time_limit || 10,
      primaryTask: scenario.primary_task || "",
      commonMistakes: commonMistakes,
      scoringRubric: scoringRubric,
      successCriteria: successCriteria
    })) || [];

    // --- Format quizzes properly (single quiz per game) ---
    const formattedQuizzes = previousPayload.quizzes?.map((quiz) => ({
      quizId: quiz.quizId,
      quizTopic: quiz.quizTopic || "",
      quizLength: quiz.quizQuestions?.length || 0,
      immediateFeedback: quiz.immediateFeedback || false,
      timer: quiz.timer || false,
      time: quiz.time || 10,
      passRate: quiz.passRate || 0,
      quizQuestions: quiz.quizQuestions?.map((q) => ({
        question: q.question_description || "",
        choices: {
          A: q.choices[0] || "",
          B: q.choices[1] || "",
          C: q.choices[2] || "",
          D: q.choices[3] || "",
        },
        explanation: q.explanation || "",
        correctAnswer: ["A","B","C","D"][q.correct_answer] || "A",
      })) || [],
    })) || [];

    // --- Construct final payload ---
    const payload = {
      createdBy: previousPayload.createdBy || 1,
      gameTitle: previousPayload.gameTitle || "",
      gameDesc: previousPayload.gameDesc || {},
      numScenario: formattedScenarios.length,
      personas: previousPayload.personas || [],
      quizzes: formattedQuizzes,
      scenarios: formattedScenarios,
    };

    console.log("Final payload to send:", payload);

    // --- Send to backend ---
    try {
      const response = await fetch("http://localhost:3000/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to save scenario:", data.error);
        alert("Failed to save scenario.");
        return;
      }

      alert("Scenario saved successfully!");
      navigate("/educator-dashboard", { state: { scenarioId: data.scenario_id } });
    } catch (err) {
      console.error("Error saving scenario:", err);
      alert("Error saving scenario.");
    }
  };

  return (
    <section className="scenario-outcomes-container">
      <EducatorProgressSidebar currentStep={5} />

      <div className="form-container">
        <h1 className="form-title">Scenario Builder</h1>
        <h1 className="form-title">Step 3: Expected Outcomes & Evaluation</h1>
        <h3 className="form-subtitle">
          Define how student responses will be assessed and what success looks like.
        </h3>

        <div className="form-content">
          <form onSubmit={handleSubmit} className="scenario-outcomes-form">
            {/* Success Criteria */}
            <label htmlFor="successCriteria">Success Criteria</label>
            <textarea
              id="successCriteria"
              rows="4"
              value={successCriteria}
              placeholder="List the measurable outcomes that indicate success."
              onChange={(e) => setSuccessCriteria(e.target.value)}
              required
            />
            <small className="field-hint">
              Define what success looks like (learning outcomes). E.g., clear communication, appropriate prioritisation, evidence-based decision-making.
            </small>

            {/* Sample Questions */}
            <label htmlFor="sampleQuestions">Sample Questions to Ask the AI</label>
            <textarea
              id="sampleQuestions"
              rows="4"
              value={sampleQuestionsText}
              placeholder={`Enter example questions separated by commas, e.g.\n"What is the impact on time?", "Do we have the skill?", "What is your current progress?"`}
              onChange={(e) => {
                setSampleQuestionsText(e.target.value);
                // Convert comma-separated string into array
                const questionsArray = e.target.value
                  .split(",")
                  .map((q) => q.trim())
                  .filter((q) => q !== "");
                setSampleQuestions(questionsArray);
              }}
              required
            />
            <small className="field-hint">
              These are example questions educators can provide to guide student or AI thinking during the scenario.
            </small>


            {/* Sample Answer */}
            <label htmlFor="sampleAnswer">Sample Answer / Example Response</label>
            <textarea
              id="sampleAnswer"
              rows="4"
              value={sampleAnswer}
              placeholder="Provide an example of an ideal response."
              onChange={(e) => setSampleAnswer(e.target.value)}
              required
            />
            <small className="field-hint">
              Provide a model response that demonstrates strong reasoning and alignment with project goals.
            </small>

            {/* Scoring Rubric */}
            <label htmlFor="scoringRubric">Scoring Rubric (Comma-Separated)</label>
            <textarea
              id="scoringRubric"
              rows="4"
              value={scoringRubric}
              placeholder="Define criteria e.g., Stakeholder reference, scope acknowledgement, description for each score level."
              onChange={(e) => setScoringRubric(e.target.value)}
              required
            />
            <small className="field-hint">
              Specify the criteria used to evaluate responses. E.g., accuracy, depth, and relevance. Separate multiple points with commas.
            </small>

            {/* Common Mistakes */}
            <label htmlFor="commonMistakes">Common Mistakes to Avoid</label>
            <textarea
              id="commonMistakes"
              rows="4"
              value={commonMistakes}
              placeholder="List frequent errors or misconceptions students might have."
              onChange={(e) => setCommonMistakes(e.target.value)}
              required
            />
            <small className="field-hint">
              Highlight typical errors or misconceptions. E.g., ignoring constraints, misinterpreting stakeholder intent.
            </small>

            {/* Save Button */}
            <button type="submit" className="save-button">
              Save & Publish Scenario
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ExpectedOutcomes;
