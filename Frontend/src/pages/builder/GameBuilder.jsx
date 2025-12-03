import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';

export default function GameBuilder() {
    return (
        <Layout role="educator">
            <div className="card">
                <h2>Game Builder</h2>
                <ul className="steps">
                    <li>Game Info</li>
                    <li>Quiz Creation</li>
                    <li>Persona Selection</li>
                    <li>Scenario Creation</li>
                    <li>Review & Publish</li>
                </ul>
                <div className="row wrap gap">
                    <Link to="/GameBuilder/Quiz" className="btn">Create Quiz</Link>
                    <Link to="/GameBuilder/PersonaSelection" className="btn">Select Personas</Link>
                    <Link to="/GameBuilder/ScenarioIntro" className="btn">Scenario Intro</Link>
                    <Link to="/GameBuilder/Evaluation" className="btn white">Review & Publish</Link>
                </div>
            </div>
        </Layout>
    );
}
