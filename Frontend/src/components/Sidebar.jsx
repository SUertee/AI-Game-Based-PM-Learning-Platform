import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/sidebar_logo.png'; // PersonAI logo

export default function Sidebar({ role = 'student' }) {
    const { pathname } = useLocation();

    const studentLinks = [
        { to: '/student-dashboard', label: 'Overview' },
        { to: '/student-report', label: 'View Reports' },
        { to: '/game-selection', label: 'Games' },
    ];

    const educatorLinks = [
        { to: '/educator-dashboard', label: 'Overview' },
        { to: '/game-builder', label: 'Game Builder' },
        { to: '/educator-games', label: 'Your Games' },
    ];

    const links = role === 'educator' ? educatorLinks : studentLinks;

    return (
        <aside className="sidebar">
            {/* Logo and title */}
            <div className="sidebar-header">
                <img src={logo} alt="PersonAI Logo" className="sidebar-logo" />
            </div>

            {/* Role title */}
            {/*<div className="sidebar-title">*/}
            {/*    {role === 'educator' ? 'Educator' : 'Student'} Panel*/}
            {/*</div>*/}

            {/* Navigation */}
            <ul className="sidebar-list">
                {links.map(({ to, label }) => (
                    <li key={to}>
                        <Link
                            className={`sidebar-link ${pathname === to ? 'active' : ''}`}
                            to={to}
                        >
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Logout button */}
            <div className="logout">
                <Link to="/" className="sidebar-link">
                    Logout
                </Link>
            </div>
        </aside>
    );
}