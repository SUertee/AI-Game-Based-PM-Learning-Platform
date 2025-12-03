import { Link } from 'react-router-dom';

export default function Navbar() {
    //Make a standard nav bar - for now just has options for selecting student or educator
    return (
        <header className="navbar">
            <div className="brand">PM Game</div>
            <nav className="nav-actions">
                <Link to="/student-dashboard" className="btn white small">Student</Link>
                <Link to="/educator-dashboard" className="btn white small">Educator</Link>
            </nav>
        </header>
    );
}
