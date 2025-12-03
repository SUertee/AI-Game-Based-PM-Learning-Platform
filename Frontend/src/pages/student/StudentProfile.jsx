import Layout from '../../components/Layout.jsx';
import '../../styles/dashboard/student_profile.css'
const studentProfile = {
    name: "Student Name",
    email: "student@example.com",
    bio: "Information goes here",
    learningSummary: {
        completedGames: 12,
        averageScore: "99%"
    },
    badgesEarned: 6,
    totalBadges: 10
};

export default function StudentProfile() {
    return (
        <Layout role="student">
            {/* Profile Info */}
            <div className="profile-card">
                <div className="profile-header">
                    {/* Avatar */}
                    <div className="profile-avatar">
                        <span className="avatar-icon">👤</span>
                    </div>

                    {/* Name & Email */}
                    <div>
                        <h2 className="profile-name">{studentProfile.name}</h2>
                        <p className="profile-email">{studentProfile.email}</p>
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div className="profile-section">
                <h3 className="section-title">Bio</h3>
                <div className="section-box">{studentProfile.bio}</div>
            </div>

            {/* Learning Summary */}
            <div className="profile-section">
                <h3 className="section-title">Learning Summary</h3>
                <div className="summary-grid">
                    <div className="summary-box">Completed {studentProfile.learningSummary.completedGames} Games</div>
                    <div className="summary-box">Average Scores: {studentProfile.learningSummary.averageScore}</div>
                </div>
            </div>

            {/* Badges */}
            <div className="profile-section">
                <h3 className="section-title">Badges Earned</h3>
                <div className="badges-row">
                    {Array.from({ length: studentProfile.totalBadges }).map((_, i) => (
                        <div
                            key={i}
                            className={`badge ${i < studentProfile.badgesEarned ? "earned" : ""}`}
                        >
                            ⭐
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
