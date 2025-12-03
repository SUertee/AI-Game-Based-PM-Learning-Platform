import Layout from '../../components/Layout.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import { Link } from 'react-router-dom';
import '../../styles/dashboard/dashboard.css';

const educatorDashboard = {
    user: "Jake",
    students: [
        {
            name: 'Harry',
            score: '82%',
            completed: 7,
            total: 12,
            strength: 'Strong knowledge on requirements analysis, stakeholder communications',
            weakness: 'Needs further improvement in schedule compression'
        },
        {
            name: 'Fideris',
            score: '75%',
            completed: 6,
            total: 12,
            strength: 'Good at team collaboration and communication',
            weakness: 'Struggles with risk trade-offs'
        },
        {
            name: 'Alex',
            score: '88%',
            completed: 9,
            total: 12,
            strength: 'Excellent at scope management',
            weakness: 'Needs to improve time estimation skills'
        }
    ]
};

export default function EducatorDashboard() {
    return (
        <Layout role="educator">
            <div className="dashboard-introduction">
                <h2>Hello {educatorDashboard.user}</h2>
                <p>Lets make games to help your students learn PM!</p>
                <div className="row gap">
                    <Link to="/game-builder" className="btn primary">Create New Game</Link>
                    <Link to="/educator-games" className="btn primary">View Your Games</Link>
                </div>
                <br />
            </div>

            <div className="card">
                <h3>Your Class</h3>
                {/* Map each student to a card */}
                {educatorDashboard.students.map((s, i) => (
                    <div key={i} className="card nested">
                        <div className="row space">
                            <strong>{s.name}</strong>
                            <span>Score: {s.score}</span>
                        </div>
                        <p className="small">
                            Progress: {s.completed}/{s.total} Completed
                        </p>
                        <ProgressBar value={s.completed} max={s.total} />
                        <p><strong>Strength:</strong> {s.strength}</p>
                        <p><strong>Weakness:</strong> {s.weakness}</p>
                    </div>
                ))}
            </div>
        </Layout>
    );
}
