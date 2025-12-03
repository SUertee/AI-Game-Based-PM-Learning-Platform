import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import '../../styles/dashboard/dashboard.css';

export default function StudentDashboard() {
    const sid = localStorage.getItem("uid");
    const username = localStorage.getItem("username");

    const [studentDashboard, setStudentDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const response = await fetch(`http://localhost:4000/student/overview/${sid}`);
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                const data = await response.json();
                console.log(data)
                setStudentDashboard(data);
            } catch (err) {
                console.error('Failed to fetch dashboard:', err);
                setError('Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        }

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <Layout role="student">
                <p>Loading dashboard...</p>
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

    if (!studentDashboard) {
        return (
            <Layout role="student">
                <p>No dashboard data available.</p>
            </Layout>
        );
    }

    // Derived values
    const completionPercentage = Math.round(
        (studentDashboard.gameComplete / studentDashboard.gameNum) * 100
    );
    const strengths = studentDashboard.strengthAndWeakness
        ?.split("Weaknesses:")[0]
        ?.replace("Strengths:", "")
        ?.trim() || "N/A";
    const weaknesses = studentDashboard.strengthAndWeakness
        ?.split("Weaknesses:")[1]
        ?.trim() || "N/A";

    return (
        <Layout role="student">
            {/* Hero Section */}
            <div className="dashboard-introduction">
                <div>
                    <h2>Welcome {username}! Your ID is {sid}</h2>
                    <p>Level up your project management skills!</p>
                </div>
                <Link to="/game-selection" className="btn primary">
                    Start New Game
                </Link>
            </div>

            {/* Game Completion Card */}
            <div className="card">
                <h3>Game Completed</h3>
                <div className="row space">
                    <span>
                        {studentDashboard.gameComplete}/{studentDashboard.gameNum} Completed
                    </span>
                    <span>{completionPercentage}%</span>
                </div>
                <br />
                <ProgressBar
                    value={studentDashboard.gameComplete}
                    max={studentDashboard.gameNum}
                />
            </div>

            {/* Progress Overview Card */}
            <div className="card">
                <h3>Progress Overview</h3>
                <ul className="stats">
                    <li><strong>Completed:</strong> {studentDashboard.gameComplete} Games</li>
                    <li><strong>Quiz Score:</strong> {studentDashboard.totalQuizScore}</li>
                    <li><strong>Scenario Score:</strong> {studentDashboard.totalScenarioScore}</li>
                    <li>
                        <strong>Overall:</strong>{' '}
                        {Math.round(
                            (studentDashboard.totalQuizScore + studentDashboard.totalScenarioScore) / 2
                        )}
                    </li>
                </ul>
            </div>

            {/* Strengths & Weaknesses Card */}
            <div className="card">
                <h3>Strengths and Weaknesses Summary</h3>
                <p><strong>Strengths:</strong> {strengths}</p>
                <p><strong>Weaknesses:</strong> {weaknesses}</p>
                <div className="row gap">
                    <Link to="/Student/StudentReport" className="btn">
                        View Detailed Game Reports
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
