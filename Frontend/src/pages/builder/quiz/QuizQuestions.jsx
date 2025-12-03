import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "../../../context/GameContext.jsx";
import EducatorProgressSidebar from "../layout/EducatorProgressSidebar.jsx";
import "../../../styles/builder/quiz/QuizQuestions.css";

const QuizQuestions = () => {
  const { gameId } = useGame();
  const [questions, setQuestions] = useState([
    { question: "", choices: { A: "", B: "", C: "", D: "" }, correctAnswer: "", explanation: "" }
  ]);

  const navigate = useNavigate();
  const location = useLocation();

  const previousPayload = location.state || {};

  // retrieve quiz config from previous page (if passed)
  const quizConfig = location.state?.quizConfig || {};

  // --- Handlers ---
  const handleQuestionChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].question = value;
    setQuestions(updated);
  };

  const handleChoiceChange = (qIndex, choiceKey, value) => {
    const updated = [...questions];
    updated[qIndex].choices[choiceKey] = value;

    // Check for duplicates
    const choiceValues = Object.values(updated[qIndex].choices).map((c) => c.trim());
    const uniqueCount = new Set(choiceValues.filter((v) => v)).size;
    if (uniqueCount < choiceValues.filter((v) => v).length) {
      alert("Duplicate option detected. Each choice must be unique.");
    }

    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIndex, choiceKey) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = choiceKey;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].explanation = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { question: "", choices: { A: "", B: "", C: "", D: "" }, correctAnswer: "", explanation: "" }
    ]);
  };

  const removeQuestion = (qIndex) => {
    setQuestions(prev => prev.filter((_, i) => i !== qIndex));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasErrors = questions.some(
      (q) =>
        !q.correctAnswer ||
        !q.question.trim() ||
        Object.values(q.choices).some((choice) => !choice.trim())
    );

    if (hasErrors) {
      alert("Please fill in all questions, choices, and select a correct answer.");
      return;
    }

    if (!gameId) {
      alert("Missing quizId or gameId. Please create a quiz first.");
      return;
    }

    const payloadQuestions = questions.map((q) => {
      const choicesArray = [q.choices.A, q.choices.B, q.choices.C, q.choices.D];
      const correctAnswerIndex = ["A", "B", "C", "D"].indexOf(q.correctAnswer);

      return {
        question_description: q.question.trim(),
        choices: choicesArray,                 
        correct_answer: correctAnswerIndex, 
        explanation: q.explanation.trim(),
      };
    });

    // Merge with previous payload
    const mergedPayload = {
      ...previousPayload,
      quizzes: previousPayload.quizzes
        ? previousPayload.quizzes.map((quiz) => ({
            ...quiz,
            quizLength: questions.length, 
            quizQuestions: payloadQuestions,
          }))
        : [
            {
              ...quizConfig,
              quizLength: questions.length,
              quizQuestions: payloadQuestions,
            },
          ],
    };
    
    console.log("Final Quiz Questions Payload:", mergedPayload);

    // Navigate to next step with full payload
    navigate("/scenario-introduction", { state: mergedPayload });
    


  };

  return (
    <section className="quiz-questions-container">
      <EducatorProgressSidebar currentStep={2} />

      <div className="form-container">
        <h1 className="form-title">Add Quiz Questions</h1>
        <h3 className="form-subtitle">
          Create multiple-choice questions to test student understanding before they attempt the scenario task.
        </h3>

        {/* Quiz Length Display */}
        <div className="quiz-length-display">
          <strong>Quiz Length:</strong> {questions.length} question{questions.length !== 1 && "s"}
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <label className="question-label">Question {qIndex + 1}</label>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="remove-question"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Question Text */}
              <input
                type="text"
                value={q.question}
                placeholder="Enter your question here"
                onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                required
              />

              {/* Choices */}
              <div className="options-list">
                {["A", "B", "C", "D"].map((key) => (
                  <div key={key} className="option-row">
                    <span className="option-label">Option {key}</span>
                    <input
                      type="text"
                      value={q.choices[key]}
                      placeholder={`Enter option ${key}`}
                      onChange={(e) => handleChoiceChange(qIndex, key, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`correct-btn ${q.correctAnswer === key ? "selected" : ""}`}
                      onClick={() => handleCorrectAnswerChange(qIndex, key)}
                    >
                      Correct
                    </button>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <label className="explanation-label">Correct Answer Explanation</label>
              <textarea
                className="explanation-input"
                value={q.explanation}
                placeholder="Provide an explanation or rationale for the correct answer"
                onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                required
              />
            </div>
          ))}

          <div className="button-bar">
            <button type="button" className="add-question" onClick={addQuestion}>
              ➕ Add Another Question
            </button>
            <button type="submit" className="save-button">Save Questions</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default QuizQuestions;
