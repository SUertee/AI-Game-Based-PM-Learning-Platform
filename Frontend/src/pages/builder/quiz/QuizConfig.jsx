import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../styles/builder/quiz/QuizConfig.css";
import EducatorProgressSidebar from "../layout/EducatorProgressSidebar.jsx";

const QuizConfig = () => {
  const [quizTopic, setQuizTopic] = useState("");
  const [passThreshold, setPassThreshold] = useState("");
  const [immediateFeedback, setImmediateFeedback] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [time, setTime] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const previousPayload = location.state || {}; // All previous data from Quiz Builder

  const handleSubmit = async (e) => {
    e.preventDefault();

    const config = {
      quizId: 1,
      quizTopic: quizTopic.trim(),
      passRate: Number(passThreshold),
      immediateFeedback: immediateFeedback,
      timer: timerEnabled,
      time: timerEnabled ? Number(time) * 60 : null,
      quizLength: 0,
      quizQuestions: []
    };

    // Merge with previous payload
    const mergedPayload = {
      ...previousPayload,
      quizzes: [config]    
    };

    console.log("Quiz created successfully:", mergedPayload);
    // navigate to QuizQuestions, pass config
    navigate("/quiz-questions", { state: mergedPayload });
  };

  return (
    <section className="quiz-config-container">
      <EducatorProgressSidebar currentStep={1} />

      <div className="form-container">
        <h1 className="form-title">Quiz Configuration</h1>
        <h3 className="form-subtitle">
          Set up the quiz details and rules before assigning it to your students.
        </h3>

        <div className="form-content">
          <form onSubmit={handleSubmit} className="quiz-form">
            {/* Quiz Topic */}
            <label htmlFor="topic">Quiz Topic</label>
            <input
              id="topic"
              type="text"
              value={quizTopic}
              placeholder="e.g. Scope Management"
              onChange={(e) => setQuizTopic(e.target.value)}
              required
            />

            {/* Pass Threshold */}
            <label htmlFor="passThreshold">Pass Threshold (%)</label>
            <input
              id="passThreshold"
              type="number"
              min="0"
              max="100"
              value={passThreshold}
              onChange={(e) => setPassThreshold(e.target.value)}
              required
            />

            {/* Immediate Feedback + Timer checkboxes side by side */}
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={immediateFeedback}
                  onChange={() => setImmediateFeedback(!immediateFeedback)}
                />
                Enable Immediate Feedback
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={() => setTimerEnabled(!timerEnabled)}
                />
                Enable Timer
              </label>
            </div>

            {timerEnabled && (
              <>
                <label htmlFor="time">Time Limit (minutes)</label>
                <input
                  id="time"
                  type="number"
                  min="1"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </>
            )}

            {/* Save Button */}
            <button type="submit" className="save-button">
              Save & Continue
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default QuizConfig;
