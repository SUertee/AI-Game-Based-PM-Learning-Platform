import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Layout from '../../../components/Layout.jsx';
import { generateStrengthsAndWeaknesses } from '../../../services/ollama/gameStrengthsAndWeaknesses.js';

export default function GameSummary() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const gameData = state?.gameData;
  const quizOutcome = state?.quizOutcome || {};

  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [aiSWReport, setAiSWReport] = useState('');
  const [generatingSW, setGeneratingSW] = useState(false);

  useEffect(() => {
    if (!gameData) navigate('/student-dashboard', { replace: true });
  }, [gameData, navigate]);

  if (!gameData) return null;

  // --- QUIZ RECORDS ---
  const quizRecords = useMemo(() => {
    return (gameData.quizzes || []).map((q, qi) => {
      const o = quizOutcome[qi] || {};
      const total = Number.isFinite(o.total) ? o.total : (q?.quizQuestions?.length || 0);
      const correct = Number.isFinite(o.correct) ? o.correct : 0;
      const computedRate = total > 0 ? Math.round((correct / total) * 100) : 0;
      const rate = Number.isFinite(o.rate) ? Math.round(o.rate) : computedRate;
      const passRate = Number.isFinite(q?.passRate) ? q.passRate : 0;
      const passed = typeof o.passed === 'boolean' ? o.passed : (rate >= passRate);
      return {
        qi,
        topic: q?.quizTopic || `Quiz ${qi + 1}`,
        correct,
        total,
        rate,
        passRate,
        passed,
      };
    });
  }, [gameData, quizOutcome]);

  const totalCorrect = quizRecords.reduce((s, r) => s + r.correct, 0);
  const totalQuestions = quizRecords.reduce((s, r) => s + r.total, 0);
  const overall = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const passedCount = quizRecords.filter(r => r.passed).length;
  const title = gameData?.gameTitle || 'Game';
  const strongest = quizRecords.length ? [...quizRecords].sort((a,b)=>b.rate-a.rate)[0].topic : '—';
  const weakest  = quizRecords.length ? [...quizRecords].sort((a,b)=>a.rate-b.rate)[0].topic : '—';

  // --- TASK RECORDS ---
  const taskRecords = useMemo(() => {
    const gId = gameData?.gameId ?? "0";
    const scenarios = gameData.scenarios || [];
    console.log(gameData, "THAT WAS GAMEDATA\n\n\n")
    console.log(scenarios)
    return scenarios.map((s, si) => {
      const key = `pmGame:${gId}:task:${si}`;
      let parsed = null;
      try {
        const raw = localStorage.getItem(key);
        parsed = raw ? JSON.parse(raw) : null;
      } catch (e) {
        parsed = null;
      }
      return {
        si,
        title: s?.scenarioName || `Scenario ${si + 1}`,
        mark: parsed && typeof parsed.mark === 'number' ? parsed.mark : (parsed && parsed.mark != null ? Number(parsed.mark) : null),
        evalText: parsed?.evalText ?? null,
        timestamp: parsed?.timestamp ?? null,
        hasStored: !!parsed
      };
    });
  }, [gameData]);
  console.log(taskRecords)
  const completedTasks = taskRecords.filter(t => typeof t.mark === 'number');
  const avgTaskMark = completedTasks.length > 0
      ? Math.round(completedTasks.reduce((s,t)=>s + (t.mark || 0), 0) / completedTasks.length)
      : null;

  const toggleExpand = (si) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(si)) next.delete(si); else next.add(si);
      return next;
    });
  };

  const formatDate = (ts) => {
    try { return ts ? new Date(ts).toLocaleString() : '—'; } catch { return '—'; }
  };

  // --- EXPORT JSON ---
  const handleExport = () => {
    const exportData = { quizzes: quizRecords, tasks: taskRecords };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g,'_')}_results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- SAVE GAME SCORE ---
  const handleSaveScore = async () => {
    try {
      const quizScore = overall;
      const scenarioScore = completedTasks.length > 0
          ? Math.round(completedTasks.reduce((s,t)=>s + (t.mark || 0), 0) / completedTasks.length)
          : 0;

      const concatenatedEvalText = taskRecords.map(t => t.evalText).filter(Boolean).join('\n\n');

      const strengthAndWeakness = concatenatedEvalText || '';

      const studentId = localStorage.getItem("uid") ?? 0;
      const body = {
        gameId: Number(gameData.gameId),
        studentId: Number(studentId),
        quizScore,
        scenarioScore,
        strengthAndWeakness
      };

      const res = await fetch("http://localhost:4000/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Failed to save score: ${res.statusText}`);
      await res.json();
      alert('Game results successfully saved!');
    } catch (err) {
      console.error(err);
      alert('Error saving game results.');
    }
  };

  const handleGenerateAIReport = async () => {
    const sid = localStorage.getItem("uid");
    if (!sid) {
      alert("No student ID found in localStorage");
      return;
    }

    try {
      setGeneratingSW(true);

      // Prefer stored evalText (or stored strengths/weaknesses if you changed to use that)
      const concatenatedEvalText = taskRecords
          .map(t => t.evalText)
          .filter(Boolean)
          .join('\n\n');

      // Generate strengths & weaknesses using AI
      const report = await generateStrengthsAndWeaknesses(concatenatedEvalText);
      setAiSWReport(report);

      // build same body shape as handleSaveScore expects
      const quizScore = overall;
      const scenarioScore = completedTasks.length > 0
          ? Math.round(completedTasks.reduce((s,t)=>s + (t.mark || 0), 0) / completedTasks.length)
          : 0;

      const studentId = Number(localStorage.getItem("uid") || 0);
      const body = {
        gameId: Number(gameData.gameId),
        studentId,
        quizScore,
        scenarioScore,
        strengthAndWeakness: report    // <-- IMPORTANT: use this key
      };

      const res = await fetch("http://localhost:4000/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Surface server error body if present (helps debugging 400)
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Failed to save score: ${res.status} ${text}`);
      }

      await res.json();
      alert('Game results successfully saved!');
    } catch (err) {
      console.error(err);
      alert(`Error saving game results: ${err.message}`);
    } finally {
      setGeneratingSW(false);
    }
  };



  return (
      <Layout role="student">
        <div className="card">
          <h2>Game Summary — {title}</h2>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
            {/* QUIZ SUMMARY */}
            <section style={{borderRight: '1px solid var(--muted)', paddingRight: 12}}>
              <h4>Quiz Summary</h4>
              <ul>
                <li><strong>Overall Score:</strong> {overall}% ({totalCorrect}/{totalQuestions})</li>
                <li><strong>Quizzes Passed:</strong> {passedCount}/{quizRecords.length}</li>
                <li><strong>Strongest Quiz Topic:</strong> {strongest}</li>
                <li><strong>Weakest Quiz Topic:</strong> {weakest}</li>
              </ul>

              {quizRecords.length > 0 && (
                  <>
                    <h5>Per-Quiz Breakdown</h5>
                    <ul>
                      {quizRecords.map(r => (
                          <li key={r.qi} style={{marginBottom: 8}}>
                            <strong>{r.topic}</strong>
                            <div style={{fontSize: 13, color: '#444'}}>
                              {r.rate}% ({r.correct}/{r.total}) · Pass mark: {r.passRate}% · {r.passed ? '✅ Passed' : '❌ Not passed'}
                            </div>
                          </li>
                      ))}
                    </ul>
                  </>
              )}
            </section>

            {/* TASK SUMMARY */}
            <section style={{paddingLeft: 12}}>
              <h4>Task Evaluations</h4>
              <ul>
                <li><strong>Tasks Completed:</strong> {completedTasks.length}/{taskRecords.length}</li>
                <li><strong>Average Task Mark:</strong> {avgTaskMark != null ? `${avgTaskMark}%` : '—'}</li>
              </ul>

              {taskRecords.length === 0 ? (
                  <p>No tasks available for this game.</p>
              ) : (
                  <>
                    <h5>Per-Task Breakdown</h5>
                    <div>
                      {taskRecords.map(t => {
                        const expanded = expandedTasks.has(t.si);
                        return (
                            <div key={t.si} style={{border:'1px solid var(--muted)', borderRadius:6, padding:10, marginBottom:10}}>
                              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                  <strong>{t.title}</strong>
                                  <div style={{fontSize:13, color:'#444'}}>
                                    Mark: {t.mark != null ? `${t.mark}/100` : 'Not graded yet'}
                                    {t.timestamp ? ` · Saved: ${formatDate(t.timestamp)}` : ''}
                                  </div>
                                </div>
                                <div>
                                  {t.hasStored && t.evalText ? (
                                      <button
                                          className="btn primary"
                                          style={{fontSize:13, padding:'6px 10px'}}
                                          onClick={() => toggleExpand(t.si)}
                                      >
                                        {expanded ? 'Hide evaluation' : 'View evaluation'}
                                      </button>
                                  ) : (
                                      <span style={{fontSize:13, color:'#888'}}>No evaluation</span>
                                  )}
                                </div>
                              </div>

                              {expanded && t.evalText && (
                                  <div style={{marginTop:8, background:'var(--panel)', padding:8, borderRadius:4, whiteSpace:'pre-wrap', lineHeight:1.4}}>
                                    {t.evalText}
                                  </div>
                              )}
                            </div>
                        );
                      })}
                    </div>
                  </>
              )}
            </section>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{marginTop:20}} className="row gap">
            <button className="btn primary" onClick={handleExport}>Export JSON</button>
            <button className="btn primary" onClick={handleSaveScore}>Save Game Results</button>
            <button className="btn primary" onClick={handleGenerateAIReport} disabled={generatingSW}>
              {generatingSW ? 'Generating AI SW...' : 'Generate AI Strengths & Weaknesses'}
            </button>
          </div>

          {aiSWReport && (
              <div style={{marginTop:12, background:'var(--panel)', padding:8, borderRadius:4, whiteSpace:'pre-wrap', lineHeight:1.4}}>
                {aiSWReport}
              </div>
          )}

        </div>
        <Link to="/student-report" className="btn primary">
          Back to reports
        </Link>
      </Layout>
  );
}
