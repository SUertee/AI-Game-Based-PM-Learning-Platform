// src/components/PersonaCard.jsx
import "../styles/game/scenario/PersonaCard.css"; // contains the persona styles you already wrote

export default function PersonaCard({ name, role, avatar, profile, traits, motivation, attitude, size = "sm" }) {

  return (
    <div className={`persona ${size}`}>
      <div className="persona-layer persona-bg" />
      <div className="persona-layer persona-inner" />
      <div className="persona-content">
        <div className="persona-header">
          <div className="persona-name">{name}</div>
          <div className="persona-role">{role}</div>
        </div>

        <div className="persona-body">
          <img className="persona-avatar" src={avatar} alt={name} />

          <div className="persona-meta">
            <div className="persona-section profile">
              <div className="persona-label">Profile</div>
              <p>{profile}</p>
            </div>
            <div className="persona-section traits">
              <div className="persona-label">Traits</div>
              <p>{traits}</p>
            </div>
          </div>

          <div className="persona-section motivation">
            <div className="persona-label">Motivation</div>
            <p>{motivation}</p>
          </div>

          <div className="persona-section attitude">
            <div className="persona-label">Attitude</div>
            <p>{attitude}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
