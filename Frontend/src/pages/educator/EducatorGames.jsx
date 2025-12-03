import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout.jsx";

/**
 * EducatorGames.jsx
 * Handles three acceptance cases:
 * - TC-E13-A01: Fetch failure → controlled error message (no crash)
 * - TC-E13-A02: Zero-state → friendly, guided empty view
 * - Normal → show educator’s games list
 */

export default function EducatorGames() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        async function fetchAllGames() {
            try {
                const res = await fetch("http://localhost:4000/games/all");
                if (!res.ok) {
                    console.error("Fetch /games failed with status", res.status);
                    setLoadFailed(true);
                    return;
                }

                let data;
                try {
                    data = await res.json();
                } catch (parseErr) {
                    console.error("Failed to parse /games JSON", parseErr);
                    setLoadFailed(true);
                    return;
                }

                if (!Array.isArray(data)) {
                    console.error("Fetch /games returned non-array payload", data);
                    setLoadFailed(true);
                    return;
                }

                const mapped = data.map(g => ({
                    gameId: g.gameId,
                    educator_id: g.createdBy,
                    educator_name: "You",
                    game_title: g.gameTitle,
                    game_description: g.gameDescription,
                    scenario_num: g.scenarioNum,
                    link: `/game-builder?gameId=${g.gameId}`,
                }));

                setGames(mapped);
            } catch (e) {
                console.error("Network/logic error loading /games", e);
                setLoadFailed(true);
            } finally {
                setLoading(false);
            }
        }

        fetchAllGames();
    }, []);

    // ---------- Render States ----------

    const renderBodyLoading = <p>Loading...</p>;

    // ❌ TC-E13-A01 – load failure (network/DB error)
    const renderBodyError = (
        <div
            className="pa-error"
            role="alert"
            style={{ color: "red", marginBottom: "1rem", fontWeight: 500 }}
        >
            We couldn’t load your games right now. Please refresh.
        </div>
    );

    // ⚪ TC-E13-A02 – zero-state (educator has no games)
    const renderBodyNoGames = (
        <div
            className="zero-state"
            role="status"
            style={{
                textAlign: "center",
                padding: "2rem 1rem",
                lineHeight: "1.6",
            }}
        >
            <p style={{ fontSize: "1.1rem", marginBottom: "0.8rem" }}>
                You haven’t created any games yet.
            </p>
            <p style={{ marginBottom: "1.2rem" }}>
                Click <strong>“Create New Game”</strong> to get started.
            </p>
            <Link to="/game-builder" className="btn primary">
                Create New Game
            </Link>
        </div>
    );

    // ✅ Normal populated state
    const renderBodyGames = (
        <div className="grid two">
            {games.map((game, idx) => (
                <div className="card nested" key={idx}>
                    <h3>{game.game_title}</h3>
                    <p>{game.game_description}</p>
                    <h4>Number of scenarios: {game.scenario_num}</h4>
                    <div className="row gap">
                        <Link to={game.link} className="btn primary">
                            Customise the Game
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );

    // ---------- Determine which state to show ----------

    let bodyContent;
    if (loading) {
        bodyContent = renderBodyLoading;
    } else if (loadFailed) {
        bodyContent = renderBodyError;
    } else if (games.length === 0) {
        bodyContent = renderBodyNoGames; 
    } else {
        bodyContent = renderBodyGames;
    }

    return (
        <Layout role="educator">
            <div className="card">
                <h2>Your Games</h2>
                <p>Manage and customise the games you’ve created for students.</p>
                {bodyContent}
            </div>

            {/* Keep CTA visible even on error or zero-state */}
            {!loading && !loadFailed && games.length > 0 && (
                <div className="card" style={{ textAlign: "center" }}>
                    <h3>Or create another game</h3>
                    <Link to="/game-builder" className="btn primary">
                        Create New Game
                    </Link>
                </div>
            )}
        </Layout>
    );
}
