import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';

export default function GameSelection() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchGames() {
            try {
                const response = await fetch('http://localhost:4000/games/all');
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const data = await response.json();
                console.log(data)
                setGames(data);
            } catch (err) {
                console.error('Error fetching games:', err);
                setError('Failed to load available games.');
            } finally {
                setLoading(false);
            }
        }

        fetchGames();
    }, []);

    if (loading) {
        return (
            <Layout role="student">
                <p>Loading available games...</p>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout role="student">
                <p className="error">{error}</p>
            </Layout>
        );
    }

    if (games.length === 0) {
        return (
            <Layout role="student">
                <div className="card">
                    <h2>Available Games</h2>
                    <p>No games available at the moment.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout role="student">
            <div className="card">
                <h2>Available Games</h2>
                <p>Choose one of the available games below.</p>

                <div className="grid two">
                    {games.map((game) => {
                        let timePeriod = null;
                        let scopeStatement = null;
                        let budget = null;
                        
                        const description = game.gameDescription || '';
                        
                        // 尝试多种方法解析
                        try {
                            // 方法1: 直接解析JSON
                            const parsed = JSON.parse(description);
                            timePeriod = parsed.time_period;
                            scopeStatement = parsed.scope_statement;
                            budget = parsed.budget;
                        } catch (e) {
                            try {
                                // 方法2: 先替换转义的反斜杠再解析
                                const cleaned = description.replace(/\\\"/g, '"');
                                const parsed = JSON.parse(cleaned);
                                timePeriod = parsed.time_period;
                                scopeStatement = parsed.scope_statement;
                                budget = parsed.budget;
                            } catch (e2) {
                                // 方法3: 使用正则表达式提取
                                const timeMatch = description.match(/"time_period"\s*:\s*"([^"]+)"/);
                                const scopeMatch = description.match(/"scope_statement"\s*:\s*"([^"]+)"/);
                                const budgetMatch = description.match(/"budget"\s*:\s*"([^"]+)"/);
                                
                                if (timeMatch) timePeriod = timeMatch[1];
                                if (scopeMatch) scopeStatement = scopeMatch[1];
                                if (budgetMatch) budget = budgetMatch[1];
                            }
                        }

                        const hasStructuredData = timePeriod || scopeStatement || budget;

                        return (
                            <div className="card nested" key={game.gameId}>
                                <h3>{game.gameTitle}</h3>
                                <i>By {game.educatorName || 'Unknown Educator'}</i>
                                
                                {hasStructuredData ? (
                                    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                                        {timePeriod && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <strong style={{ color: '#2563eb', fontSize: '14px' }}> Time Period</strong>
                                                <p style={{ marginTop: '4px', fontSize: '14px', lineHeight: '1.5', color: '#4b5563' }}>
                                                    {timePeriod}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {scopeStatement && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <strong style={{ color: '#2563eb', fontSize: '14px' }}> Scope Statement</strong>
                                                <p style={{ marginTop: '4px', fontSize: '14px', lineHeight: '1.5', color: '#4b5563' }}>
                                                    {scopeStatement}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {budget && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <strong style={{ color: '#2563eb', fontSize: '14px' }}> Budget</strong>
                                                <p style={{ marginTop: '4px', fontSize: '14px', lineHeight: '1.5', color: '#4b5563' }}>
                                                    {budget}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>{description}</p>
                                )}
                                
                                <h4>Number of scenarios: {game.scenarioNum}</h4>
                                <div className="row gap">
                                    <Link
                                        to={`/project-intro/${game.gameId}`}
                                        className="btn primary"
                                    >
                                        Start Game
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
