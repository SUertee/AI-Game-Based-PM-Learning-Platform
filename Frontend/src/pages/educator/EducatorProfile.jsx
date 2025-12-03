import Layout from '../../components/Layout.jsx';
import '../../styles/dashboard/student_profile.css';

const educatorProfile = {
    name: "Educator Name",
    email: "educator@example.com",
    bio: "The guy is lazy, does not leave any information",
    teachingSummary: {
        gamesMade: 12,
        studentsTaught: 3
    }
};

export default function EducatorProfile() {
    return (
        <Layout role="educator">
            {/* Profile Info */}
            <div className="profile-card">
                <div className="profile-header">
                    {/* Avatar */}
                    <div className="profile-avatar">
                        <span className="avatar-icon">👤</span>
                    </div>

                    {/* Name & Email */}
                    <div>
                        <h2 className="profile-name">{educatorProfile.name}</h2>
                        <p className="profile-email">{educatorProfile.email}</p>
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div className="profile-section">
                <div className="row space" style={{ alignItems: 'center' }}>
                    <h3 className="section-title">Bio</h3>
                </div>
                <div className="section-box">{educatorProfile.bio}</div>
            </div>

            {/* Teaching Summary */}
            <div className="profile-section">
                <h3 className="section-title">Teaching Summary</h3>
                <div className="summary-grid">
                    <div className="summary-box">
                        Created {educatorProfile.teachingSummary.gamesMade} Games
                    </div>
                    <div className="summary-box">
                        Teaching {educatorProfile.teachingSummary.studentsTaught} Students
                    </div>
                </div>
            </div>
        </Layout>
    );
}
