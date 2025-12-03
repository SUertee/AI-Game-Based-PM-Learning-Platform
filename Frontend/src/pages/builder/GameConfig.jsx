import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../../context/GameContext.jsx"; 
import "../../styles/builder/layout.css";

const GameConfiguration = () => {

  const [gameTitle, setGameTitle] = useState("");
  const [numScenario, setNumScenario] = useState(0);
  const [TimePeriod, setTimePeriod] = useState("");
  const [ScopeStatement, setScopeStatement] = useState("");
  const [Budget, setBudget] = useState("");

  const navigate = useNavigate();
  const { setGameId } = useGame();

  const handleSave = async () => {
    if (!gameTitle || !numScenario || !TimePeriod || !ScopeStatement || !Budget) {
      alert("Please fill out all fields");
      return;
    }

    // Combine into JSON string for "description" field
    const gameDesc = JSON.stringify({
      time_period: TimePeriod,
      scope_statement: ScopeStatement,
      budget: Budget,
    });

    const payload = {
      createdBy: 1,
      gameTitle,
      gameDesc: gameDesc,
      numScenario: Number(numScenario),
    };

    console.log("Submitting payload:", payload);
    navigate("/persona-selection", { state: payload });
  };
  
  return (
    <section>
      <h1 className="page-title">Game Configuration</h1>

      <div className="form-card">
        {/* Game title */}
        <div className="field">
          <label htmlFor="gameTitle" className="label">Game title</label>
          <div className="control">
            <input
              id="gameTitle"
              type="text"
              placeholder="Enter a descriptive title for this learning game"
              className="input"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
            />
          </div>
        </div>

        {/* Number of Scenarios */}
        <div className="field">
          <label htmlFor="scenarioCount" className="label">Number of Scenarios</label>
          <div className="control">
            <select 
              id="scenarioCount" 
              className="select" 
              value={numScenario}
              onChange={(e) => setNumScenario(Number(e.target.value))}
            >
              <option value="" disabled>Value</option>
              {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Game Description */}
        <div className="field">
          <label htmlFor="TimePeriod" className="label">Time Period</label>
          <div className="control">
            <input
              id="TimePeriod"
              type="text"
              placeholder="e.g., The original timeline was 10 weeks..."
              className="input"
              value={TimePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            />
          </div> 

          <label htmlFor="ScopeStatement" className="label">Scope Statement</label>
          <div className="control">
            <input
              id="ScopeStatement"
              type="text"
              placeholder="e.g., Deliver a fully functional mobile app..."
              className="input"
              value={ScopeStatement}
              onChange={(e) => setScopeStatement(e.target.value)}
            />
          </div>  

          <label htmlFor="Budget" className="label">Budget</label> 
          <div className="control">
            <input
              id="Budget"
              type="text"
              placeholder="e.g., $200,000 AUD with no contingency"
              className="input"
              value={Budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </div>

        <div className="actions">
          <button type="button" className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </section>
  );
}

export default GameConfiguration;
