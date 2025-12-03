import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { generateStrengthsAndWeaknesses } from '../../services/ollama/gameStrengthsAndWeaknesses.js';

export default function StudentReport() {
    const id = localStorage.getItem("uid");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState({
        averageQuiz: 0,
        averageScenario: 0,
        attempts: 0,
    });
    const [expandedGames, setExpandedGames] = useState(new Set());
    const [overallSW, setOverallSW] = useState('');
    const [generatingSW, setGeneratingSW] = useState(false);

    // --- Fetch student reports and overall saved strengths/weaknesses ---
    const fetchReports = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`http://localhost:3000/student/reports/${id}`);
            if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
            const data = await res.json();
            setRecords(data);
            console.log(data)

            if (!Array.isArray(data) || data.length === 0) {
                setSummary({ averageQuiz: 0, averageScenario: 0, attempts: 0 });
                setOverallSW('None');
                return;
            }

            const attempts = data.length;

            // Compute averages
            const totalQuiz = data.reduce((sum, r) => sum + Number(r.quizScore || 0), 0);
            const totalScenario = data.reduce((sum, r) => sum + Number(r.scenarioScore || 0), 0);
            const avgQuiz = Math.round(totalQuiz / attempts);
            const avgScenario = Math.round(totalScenario / attempts);

            setSummary({ averageQuiz: avgQuiz, averageScenario: avgScenario, attempts });

            // Fetch latest saved overall strengths/weaknesses
            const aggRes = await fetch(`http://localhost:3000/student/overview/${id}`);
            if (aggRes.ok) {
                const aggData = await aggRes.json();
                setOverallSW(aggData.strengthAndWeakness || 'None');
            } else {
                setOverallSW('None');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [id]);

    const toggleGame = (gameId) => {
        setExpandedGames(prev => {
            const next = new Set(prev);
            if (next.has(gameId)) next.delete(gameId);
            else next.add(gameId);
            return next;
        });
    };

    // --- Generate & save aggregated overall strengths/weaknesses ---
    const handleGenerateAndSaveSW = async () => {
        try {
            setGeneratingSW(true);
            const allGameSW = records.map(r => r.strengthAndWeakness || '').join('\n\n');
            const swReport = await generateStrengthsAndWeaknesses(allGameSW);

            const res = await fetch(`http://localhost:3000/student/performance/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strengthAndWeakness: swReport })
            });
            if (!res.ok) throw new Error(`Failed to save: ${res.statusText}`);

            await fetchReports();
            alert('Overall Strengths & Weaknesses updated successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to generate/save overall strengths & weaknesses.');
        } finally {
            setGeneratingSW(false);
        }
    };

    if (loading) return <Layout role="student"><p>Loading student report...</p></Layout>;
    if (error) return <Layout role="student"><p style={{ color: 'red' }}>Error: {error}</p></Layout>;

    return (
        <Layout role="student">
            {/* Summary Card */}
            <div className="card">
                <h2>Student Report</h2>
                <p>Quiz and scenario scores, attempts, and overall strengths/weaknesses.</p>

                <p><strong>Average Quiz Score:</strong> {summary.averageQuiz}%</p>
                <p><strong>Average Scenario Score:</strong> {summary.averageScenario}%</p>
                <p><strong>Attempts:</strong> {summary.attempts}</p>
            </div>

            <div className="card">
                {/* Generate & Save Overall SW */}
                <div style={{marginTop: 12}}>
                    <h3>Your Strengths And Weaknesses Report</h3>
                    {overallSW && (
                        <div style={{
                            marginTop: 8,
                            background: 'var(--panel)',
                            padding: 8,
                            borderRadius: 4,
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.4
                        }}>
                            {overallSW}
                        </div>
                    )}
                </div>
                <button
                    className="btn primary"
                    onClick={handleGenerateAndSaveSW}
                    disabled={generatingSW}
                    style={{marginTop: 12}}
                >
                    {generatingSW ? 'Generating...' : 'Generate & Save Overall Strengths/Weaknesses'}
                </button>
            </div>

            {/* Game history */}
            <div className="card" style={{marginTop: 20}}>
                <h3>Game History</h3>
                {records.length === 0 ? (
                    <p>No game records found.</p>
                ) : (
                    <ul>
                        {records.map((r) => {
                            const expanded = expandedGames.has(r.gameId);
                            return (
                                <li key={r.gameId} style={{marginBottom: 12}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>
                                            Game {r.gameId} — Quiz: {r.quizScore}% — Scenario: {r.scenarioScore}%
                                        </span>
                                        <button
                                            className="btn secondary"
                                            onClick={() => toggleGame(r.gameId)}
                                            style={{fontSize: 12}}
                                        >
                                            {expanded ? 'Hide Details' : 'View Details'}
                                        </button>
                                    </div>
                                    {expanded && r.strengthAndWeakness && (
                                        <div style={{
                                            marginTop: 6,
                                            background: 'var(--panel)',
                                            padding: 8,
                                            borderRadius: 4,
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.4
                                        }}>
                                            {r.strengthAndWeakness}
                                        </div>
                                    )}
                                    {expanded && !r.strengthAndWeakness && (
                                        <div style={{marginTop: 6, color: '#888'}}>No evaluation available.</div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Layout>
    );
}
