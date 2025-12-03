import Layout from '../../components/Layout.jsx';

export default function ViewClass() {
    // Sample game history for students
    const gamesHistory = [
        { date: '2025-08-31', student: 'Student 1', activity: 'Game 2', score: '5/10', status: 'FAIL' },
        { date: '2025-09-01', student: 'Student 2', activity: 'Game 2', score: '7/10', status: 'PASS' },
        { date: '2025-09-01', student: 'Student 3', activity: 'Game 3', score: '3/5', status: 'PASS' },
    ];

    return (
        <Layout role="educator">
            <div className="card">
                <h2>View Class</h2>
                <div className="row gap">
                    <button className="btn small">This Week</button>
                    <button className="btn small">Game</button>
                    <button className="btn small">Student</button>
                </div>
            </div>

            <div className="card">
                <h3>Feedback Summary</h3>
                <p><strong>Quiz Scores:</strong> xx%</p>
                <p><strong>Scenario Score:</strong> xx%</p>
                <p><strong>Strength:</strong> User has strong knowledge on ...</p>
                <p><strong>Weaknesses:</strong> User needs further improvement in ...</p>
            </div>

            <div className="card">
                <h3>Games History</h3>
                <table className="table">
                    {/*table header is follows*/}
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Student Name</th>
                        <th>Activity</th>
                        <th>Score</th>
                        <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {/*For each game in the history, map to a row*/}
                    {gamesHistory.map((game, index) => (
                        <tr key={index}>
                            <td>{game.date}</td>
                            <td>{game.student}</td>
                            <td>{game.activity}</td>
                            <td>{game.score}</td>
                            <td>{game.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <button className="btn secondary">View more Games History</button>
            </div>
        </Layout>
    );
}
