import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

//Default layout with a navbar, and the sidebar. Children will be teh content
export default function Layout({ children, role = 'student' }) {
    return (
        <div className="layout">
            <Sidebar role={role} />
            <main className="content">
                <div className="container">{children}</div>
            </main>
        </div>
    );
}
